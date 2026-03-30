// Script para gerar seed_praias.sql a partir do Excel + coordenadas já geocodificadas
// Diferença do v1: não chama Nominatim — usa lat/lng do beaches_seed.sql existente
// Uso: node backend/scripts/gerar-seed-praias-v2.js  (executar da raiz do repo)

const XLSX = require('../../node_modules/xlsx');
const fs   = require('fs');
const path = require('path');

// ─── Caminhos ─────────────────────────────────────────────────────────────────

const ROOT        = path.resolve(__dirname, '../../');
const xlsxPath    = path.join(ROOT, 'surfyng_praias_completo.xlsx');
const seedExistente = path.join(__dirname, '../seeds/beaches_seed.sql');
const saida       = path.join(__dirname, '../seeds/seed_praias.sql');

// ─── Leitura do xlsx ──────────────────────────────────────────────────────────

const wb   = XLSX.readFile(xlsxPath);
const ws   = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Pula linha 0 (título) e linha 1 (cabeçalho)
const praias = rows.slice(2).filter(r => r.length >= 10 && r[0] && r[2]);
console.log(`[xlsx] ${praias.length} praias lidas do Excel`);

// ─── Extrai lat/lng do seed existente ────────────────────────────────────────
// Padrão no arquivo:
//   'Nome da Praia', 'Cidade', 'UF', 'BR',
//   -27.12345, -48.12345,

const seedSql = fs.readFileSync(seedExistente, 'utf8');

// Captura: nome (entre aspas, com '' escapado), lat, lng
const COORD_RE = /'((?:[^']|'')+)',\s*'(?:[^']|'')*',\s*'[A-Z]{2}',\s*'BR',\s*\n\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)/g;

const coordMap = new Map(); // nome normalizado → {lat, lng}
let m;
while ((m = COORD_RE.exec(seedSql)) !== null) {
  const nome = m[1].replace(/''/g, "'");
  const lat  = parseFloat(m[2]);
  const lng  = parseFloat(m[3]);
  coordMap.set(normalizar(nome), { lat, lng });
}
console.log(`[seed] ${coordMap.size} coordenadas carregadas do beaches_seed.sql`);

// ─── Helpers de normalização e mapeamento ────────────────────────────────────

function normalizar(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function mapDificuldade(str) {
  if (!str) return null;
  const s = normalizar(str);
  if (s.includes('alta'))                                          return 'high';
  if (s.includes('media – alta') || s.includes('media - alta'))   return 'medium_high';
  if (s.includes('media – baixa') || s.includes('media - baixa')) return 'medium_low';
  if (s.includes('baixa – media') || s.includes('baixa - media')) return 'medium_low';
  if (s.includes('media') || s.includes('medio'))                 return 'medium';
  if (s.includes('baixa'))                                        return 'low';
  return 'low';
}

function mapConsistencia(str) {
  if (!str) return null;
  const s = normalizar(str);
  if (s.includes('alta'))  return 'high';
  if (s.includes('media')) return 'medium';
  if (s.includes('baixa')) return 'low';
  return 'medium';
}

function mapCrowd(str) {
  if (!str) return null;
  const s = normalizar(str);
  if (s.includes('intenso')) return 'intense';
  if (s.includes('medio'))   return 'medium';
  if (s.includes('baixo'))   return 'low';
  return 'medium';
}

function parseTamanho(str) {
  if (!str || str === '–') return { min: null, max: null };
  const match = str.match(/(\d+)\s*a\s*(\d+)/);
  if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) };
  const single = str.match(/(\d+)/);
  if (single) return { min: parseInt(single[1]), max: parseInt(single[1]) };
  return { min: null, max: null };
}

// Converte "SE / NE / Sul" em array ['SE', 'NE', 'Sul']
function parseDirecoes(str) {
  if (!str || str === '–') return [];
  return str
    .replace(/Q\.\s*/g, '')
    .split('/')
    .map(d => d.trim())
    .filter(d => d.length > 0);
}

function parseTempAgua(str) {
  if (!str || str === '–') return { verao: null, inverno: null };
  // Formato "17–22" → inverno=17, verao=22
  const match = str.match(/(\d+)\s*[–-]\s*(\d+)/);
  if (match) return { verao: parseInt(match[2]), inverno: parseInt(match[1]) };
  const single = str.match(/(\d+)/);
  if (single) { const t = parseInt(single[1]); return { verao: t, inverno: t }; }
  return { verao: null, inverno: null };
}

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function sqlArray(arr) {
  if (!arr || arr.length === 0) return "'{}'";
  const escaped = arr.map(v => v.replace(/'/g, "''")).join('","');
  return `'{"${escaped}"}'`;
}

// ─── Geração do SQL ───────────────────────────────────────────────────────────

const linhas  = [];
const valores = [];
let semCoord  = 0;
let inseridas = 0;

linhas.push(`-- Seed completo: praias do Brasil`);
linhas.push(`-- Gerado em: ${new Date().toISOString()}`);
linhas.push(`-- Fonte: surfyng_praias_completo.xlsx | Coordenadas: beaches_seed.sql (Nominatim/OSM)`);
linhas.push(`-- Executar com: psql $DATABASE_URL -f seeds/seed_praias.sql`);
linhas.push('');
linhas.push('-- Limpa praias existentes (CASCADE remove conditions_cache, favorites, etc.)');
linhas.push('TRUNCATE beaches CASCADE;');
linhas.push('');
linhas.push('INSERT INTO beaches (');
linhas.push('  id, name, city, state, country,');
linhas.push('  lat, lng,');
linhas.push('  swell_directions, wind_directions,');
linhas.push('  min_size_feet, max_size_feet,');
linhas.push('  difficulty, consistency, crowd,');
linhas.push('  best_season,');
linhas.push('  water_temp_summer_c, water_temp_winter_c');
linhas.push(') VALUES');

for (let i = 0; i < praias.length; i++) {
  const row    = praias[i];
  const estado = String(row[0] || '').trim();
  const cidade = String(row[1] || '').trim();
  const nome   = String(row[2] || '').trim();
  const tam    = parseTamanho(row[3]);
  const swell  = parseDirecoes(row[4]);
  const vento  = parseDirecoes(row[5]);
  const dific  = mapDificuldade(row[6]);
  const melhor = String(row[7] || '').trim() || null;
  const const_ = mapConsistencia(row[8]);
  const crowd  = mapCrowd(row[9]);
  const temp   = parseTempAgua(row[10]);

  const coord = coordMap.get(normalizar(nome));

  if (!coord) {
    console.warn(`  [AVISO] Sem coordenada para: "${nome}" (${cidade}/${estado}) — pulada`);
    semCoord++;
    continue;
  }

  valores.push(`(
  gen_random_uuid(), ${escapeSql(nome)}, ${escapeSql(cidade)}, ${escapeSql(estado)}, 'BR',
  ${coord.lat}, ${coord.lng},
  ${sqlArray(swell)}, ${sqlArray(vento)},
  ${tam.min !== null ? tam.min : 'NULL'}, ${tam.max !== null ? tam.max : 'NULL'},
  ${dific ? escapeSql(dific) : 'NULL'}, ${const_ ? escapeSql(const_) : 'NULL'}, ${crowd ? escapeSql(crowd) : 'NULL'},
  ${melhor ? escapeSql(melhor) : 'NULL'},
  ${temp.verao !== null ? temp.verao : 'NULL'}, ${temp.inverno !== null ? temp.inverno : 'NULL'}
)`);

  inseridas++;
}

linhas.push(valores.join(',\n'));
linhas.push(';');
linhas.push('');
linhas.push(`-- Resumo: ${inseridas} inseridas, ${semCoord} sem coordenada (puladas)`);

fs.writeFileSync(saida, linhas.join('\n'), 'utf8');

console.log(`\n✓ Gerado: ${saida}`);
console.log(`  Inseridas:       ${inseridas}`);
console.log(`  Sem coordenada:  ${semCoord}`);
