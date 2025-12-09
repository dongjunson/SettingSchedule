import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { getSiteData, updateChecklistItem, calculateProgress } from '../lib/storage'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { ProgressPieChart } from '../components/ProgressChart'
import { Checkbox } from '../components/ui/checkbox'
import { cn } from '../lib/utils'

export default function ChecklistPage() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const [site, setSite] = useState(null)
  const [progress, setProgress] = useState({ timeline: 0, checklist: 0, overall: 0 })

  useEffect(() => {
    const siteData = getSiteData(siteId)
    if (siteData) {
      setSite(siteData)
      setProgress(calculateProgress(siteId))
    }
  }, [siteId])

  const handleCheckboxChange = (itemId, checked) => {
    updateChecklistItem(siteId, itemId, checked)
    const updatedSite = getSiteData(siteId)
    setSite(updatedSite)
    setProgress(calculateProgress(siteId))
  }

  if (!site) {
    return <div className="p-8">사업소를 찾을 수 없습니다.</div>
  }

  const completedCount = site.checklist.filter(item => item.checked).length
  const totalCount = site.checklist.length

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/site/${siteId}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            타임라인으로
          </Button>
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">{site.name} 점검 리스트</h1>
            <p className="text-muted-foreground">시스템 기능 점검 항목을 확인하세요 (총 {totalCount}개 항목)</p>
          </div>

          {/* Progress Card with Pie Chart */}
          <Card className="mb-6 border border-border/60 hover:border-chart-3/50 transition-all bg-card shadow-lg hover:shadow-xl hover:shadow-chart-3/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground mb-1">체크리스트 진행도</div>
                  <div className="text-3xl font-bold text-chart-3 mb-2">{progress.checklist}%</div>
                  <div className="text-xs text-muted-foreground">
                    {completedCount} / {totalCount} 항목 완료
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <ProgressPieChart 
                    value={progress.checklist} 
                    name="체크리스트" 
                    color="rgb(96, 165, 250)" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checklist Items */}
        <Card className="border border-border/60">
          <CardContent className="p-6">
            <div className="space-y-4">
              {site.checklist.map((item) => (
                <label
                  key={item.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all hover:bg-muted/30",
                    item.checked ? "border-primary/25 bg-primary/5" : "border-border/60"
                  )}
                >
                  <div className="mt-1">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={(checked) => handleCheckboxChange(item.id, checked)}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-muted-foreground">
                        No. {String(item.id).padStart(2, '0')}
                      </span>
                      {item.checked && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-foreground leading-relaxed">{item.text}</p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
