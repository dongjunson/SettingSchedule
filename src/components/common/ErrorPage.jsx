import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

/**
 * 에러 페이지 컴포넌트
 * @param {Object} props
 * @param {string} [props.title] - 에러 제목
 * @param {string} [props.message] - 에러 메시지
 * @param {Function} [props.onRetry] - 재시도 버튼 클릭 핸들러
 * @param {string} [props.retryText] - 재시도 버튼 텍스트
 * @param {string} [props.className] - 추가 CSS 클래스
 */
export default function ErrorPage({
  title = '오류가 발생했습니다',
  message = '데이터를 불러오는 중 문제가 발생했습니다.',
  onRetry,
  retryText = '다시 시도',
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] ${className}`}>
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground mb-4 text-center max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryText}
        </Button>
      )}
    </div>
  );
}
