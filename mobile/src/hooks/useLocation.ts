// Hook para obter localização GPS do usuário via expo-location
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface Localizacao {
  latitude:  number;
  longitude: number;
  cidade?:   string;
}

interface UseLocationResult {
  localizacao:  Localizacao | null;
  erro:         string | null;
  carregando:   boolean;
  recarregar:   () => Promise<void>;
}

export function useLocation(): UseLocationResult {
  const [localizacao, setLocalizacao] = useState<Localizacao | null>(null);
  const [erro, setErro]               = useState<string | null>(null);
  const [carregando, setCarregando]   = useState(true);

  async function obterLocalizacao() {
    setCarregando(true);
    setErro(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setErro('Permissão de localização negada. Habilite nas configurações do aparelho.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = pos.coords;

      // Geocodificação reversa para nome da cidade
      let cidade: string | undefined;
      try {
        const [endereco] = await Location.reverseGeocodeAsync({ latitude, longitude });
        cidade = endereco?.city ?? endereco?.subregion ?? undefined;
      } catch {
        // Falha silenciosa — cidade fica undefined
      }

      setLocalizacao({ latitude, longitude, cidade });
    } catch {
      setErro('Não foi possível obter sua localização. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    obterLocalizacao();
  }, []);

  return {
    localizacao,
    erro,
    carregando,
    recarregar: obterLocalizacao,
  };
}
