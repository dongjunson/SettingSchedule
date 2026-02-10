import { formatInputNumber } from '../../lib/numberUtils';
// 콤마 포맷 금액 입력 컴포넌트
import { Input } from '../ui/input';

export function AmountInput({
  value,
  onChange,
  placeholder = '0원',
  className = '',
  disabled = false,
}) {
  const displayValue = formatInputNumber(value);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/[^\d]/g, '');
    onChange(numericValue);
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
}

// 0원일 때 placeholder 스타일로 표시하는 컴포넌트
export function AmountDisplay({
  value,
  unit = '원',
  placeholderClass = 'text-muted-foreground/50',
}) {
  if (value === 0) {
    return <span className={placeholderClass}>0{unit}</span>;
  }
  return (
    <>
      {formatInputNumber(value) || value?.toLocaleString?.('ko-KR') || value}
      {unit}
    </>
  );
}
