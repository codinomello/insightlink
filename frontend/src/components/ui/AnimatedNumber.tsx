import { useCountUp } from '@/hooks/useCountUp';

interface Props {
  value: number;
  decimals?: number;
  suffix?: string;
}

/** Número que "sobe" até o valor final ao aparecer na tela. */
export default function AnimatedNumber({ value, decimals = 0, suffix }: Props) {
  const v = useCountUp(value);
  const text = v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <>
      {text}
      {suffix && <small>{suffix}</small>}
    </>
  );
}
