// Script para gerar o seed completo das 121 praias do Surfyng
// Lê o xlsx, geocodifica via Nominatim e gera o SQL de insert
// Uso: node scripts/gerar-seed-praias.js

const XLSX = require('../../node_modules/xlsx');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Leitura do xlsx ──────────────────────────────────────────────────────────

const xlsxPath = path.resolve(__dirname, '../../surfyng_praias_completo.xlsx');
const wb = XLSX.readFile(xlsxPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Pula linha 0 (título) e linha 1 (cabeçalho)
const praias = rows.slice(2).filter(r => r.length >= 10 && r[0] && r[2]);

console.log(`[xlsx] ${praias.length} praias lidas`);

// ─── Helpers de mapeamento ────────────────────────────────────────────────────

function mapDificuldade(str) {
  if (!str) return null;
  const s = str.toLowerCase().trim();
  if (s.includes('alta'))         return 'high';
  if (s.includes('média – alta') || s.includes('media – alta')) return 'medium_high';
  if (s.includes('média – baixa') || s.includes('media – baixa')) return 'medium_low';
  if (s.includes('baixa – média') || s.includes('baixa – media')) return 'medium_low';
  if (s.includes('média') || s.includes('media')) return 'medium';
  if (s.includes('baixa'))        return 'low';
  return 'low';
}

function mapConsistencia(str) {
  if (!str) return null;
  const s = str.toLowerCase().trim();
  if (s.includes('alta'))  return 'high';
  if (s.includes('média') || s.includes('media')) return 'medium';
  if (s.includes('baixa')) return 'low';
  return 'medium';
}

function mapCrowd(str) {
  if (!str) return null;
  const s = str.toLowerCase().trim();
  if (s.includes('intenso')) return 'intense';
  if (s.includes('médio') || s.includes('medio')) return 'medium';
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
  // Remove "Q. " (qualquer) e divide por " / "
  return str
    .replace(/Q\.\s*/g, '')
    .split('/')
    .map(d => d.trim())
    .filter(d => d.length > 0);
}

function parseTempAgua(str) {
  if (!str || str === '–') return { verao: null, inverno: null };
  const match = str.match(/(\d+)[–-](\d+)/);
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

// ─── Geocodificação via Nominatim ─────────────────────────────────────────────

const DELAY_MS = 1200; // respeita 1 req/s do Nominatim

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function geocodificar(nome, cidade, estado) {
  // Tenta primeiro "nome da praia, cidade, estado, Brazil"
  const query = encodeURIComponent(`${nome}, ${cidade}, ${estado}, Brazil`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br`;

  return new Promise((resolve) => {
    const options = {
      hostname: 'nominatim.openstreetmap.org',
      path: `/search?q=${query}&format=json&limit=1&countrycodes=br`,
      headers: {
        'User-Agent': 'Surfyng-seed-script/1.0 (app de surf brasileiro)',
        'Accept-Language': 'pt-BR',
      },
    };

    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json && json.length > 0) {
            resolve({ lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
  });
}

// Fallback: geocodifica apenas pela cidade
function geocodificarCidade(cidade, estado) {
  const query = encodeURIComponent(`${cidade}, ${estado}, Brazil`);
  const options = {
    hostname: 'nominatim.openstreetmap.org',
    path: `/search?q=${query}&format=json&limit=1&countrycodes=br`,
    headers: {
      'User-Agent': 'Surfyng-seed-script/1.0 (app de surf brasileiro)',
      'Accept-Language': 'pt-BR',
    },
  };

  return new Promise((resolve) => {
    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json && json.length > 0) {
            resolve({ lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
  });
}

// ─── Geração do SQL ───────────────────────────────────────────────────────────

async function main() {
  const linhas = [];
  let geocodificadas = 0;
  let fallbackCidade = 0;
  let semCoordenada = 0;

  linhas.push(`-- Seed completo: ${praias.length} praias do Brasil`);
  linhas.push(`-- Gerado em: ${new Date().toISOString()}`);
  linhas.push(`-- Fonte: guia.waves.com.br | Geocodificação: Nominatim/OpenStreetMap`);
  linhas.push('');
  linhas.push(`INSERT INTO beaches (`);
  linhas.push(`  name, city, state, country,`);
  linhas.push(`  lat, lng,`);
  linhas.push(`  swell_directions, wind_directions,`);
  linhas.push(`  min_size_feet, max_size_feet,`);
  linhas.push(`  difficulty, consistency, crowd,`);
  linhas.push(`  best_season,`);
  linhas.push(`  water_temp_summer_c, water_temp_winter_c`);
  linhas.push(`) VALUES`);

  const valores = [];

  for (let i = 0; i < praias.length; i++) {
    const row = praias[i];
    const estado = (row[0] || '').trim();
    const cidade = (row[1] || '').trim();
    const nome   = (row[2] || '').trim();
    const tam    = parseTamanho(row[3]);
    const swell  = parseDirecoes(row[4]);
    const vento  = parseDirecoes(row[5]);
    const dific  = mapDificuldade(row[6]);
    const melhor = (row[7] || '').trim() || null;
    const const_ = mapConsistencia(row[8]);
    const crowd  = mapCrowd(row[9]);
    const temp   = parseTempAgua(row[10]);

    process.stdout.write(`[${i+1}/${praias.length}] Geocodificando: ${nome}, ${cidade}/${estado}... `);

    // Tenta geocodificar pelo nome da praia
    await sleep(DELAY_MS);
    let coord = await geocodificar(nome, cidade, estado);

    if (!coord) {
      // Fallback: geocodifica pela cidade
      await sleep(DELAY_MS);
      coord = await geocodificarCidade(cidade, estado);
      if (coord) {
        console.log(`fallback cidade (${coord.lat}, ${coord.lng})`);
        fallbackCidade++;
      } else {
        console.log('SEM COORDENADA — pulando');
        semCoordenada++;
        continue;
      }
    } else {
      console.log(`ok (${coord.lat}, ${coord.lng})`);
      geocodificadas++;
    }

    const v = `(
  ${escapeSql(nome)}, ${escapeSql(cidade)}, ${escapeSql(estado)}, 'BR',
  ${coord.lat}, ${coord.lng},
  ${sqlArray(swell)}, ${sqlArray(vento)},
  ${tam.min !== null ? tam.min : 'NULL'}, ${tam.max !== null ? tam.max : 'NULL'},
  ${dific ? escapeSql(dific) : 'NULL'}, ${const_ ? escapeSql(const_) : 'NULL'}, ${crowd ? escapeSql(crowd) : 'NULL'},
  ${melhor ? escapeSql(melhor) : 'NULL'},
  ${temp.verao !== null ? temp.verao : 'NULL'}, ${temp.inverno !== null ? temp.inverno : 'NULL'}
)`;
    valores.push(v);
  }

  linhas.push(valores.join(',\n'));
  linhas.push(';');
  linhas.push('');
  linhas.push(`-- Resumo: ${geocodificadas} geocodificadas pelo nome, ${fallbackCidade} pela cidade, ${semCoordenada} sem coordenada`);

  const saida = path.resolve(__dirname, '../seeds/beaches_seed.sql');
  fs.writeFileSync(saida, linhas.join('\n'), 'utf8');

  console.log('\n');
  console.log(`✓ Seed gerado: ${saida}`);
  console.log(`  Geocodificadas pelo nome: ${geocodificadas}`);
  console.log(`  Fallback pela cidade:     ${fallbackCidade}`);
  console.log(`  Sem coordenada (puladas): ${semCoordenada}`);
  console.log(`  Total inseridas:          ${geocodificadas + fallbackCidade}`);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
