import { Loader2 } from 'lucide-react';

/**
 * 로딩 스피너 컴포넌트
 * @param {Object} props
 * @param {string} [props.message] - 로딩 메시지 (기본: '로딩 중...')
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {boolean} [props.fullScreen] - 전체 화면 중앙 배치 여부
 */
export default function LoadingSpinner({ message = '로딩 중...', className = '', fullScreen = true }) {
  const containerClass = fullScreen
    ? 'flex flex-col items-center justify-center min-h-[60vh]'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={`${containerClass} ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {message && <p className="mt-4 text-muted-foreground">{message}</p>}
    </div>
  );
}
