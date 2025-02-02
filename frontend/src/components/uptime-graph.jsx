import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"

export default function UptimeGraph({ name, data, uptime }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "operational":
        return "bg-emerald-500"
      case "degraded":
        return "bg-yellow-500"
      case "down":
        return "bg-red-500"
      default:
        return "bg-muted"
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "operational":
        return "Operational"
      case "degraded":
        return "Degraded Performance"
      case "down":
        return "Service Outage"
      default:
        return "Unknown"
    }
  }

  // Group consecutive days with the same status
  const groupedData = data.reduce(
    (acc, curr, index) => {
      if (index === 0 || curr.status !== data[index - 1].status) {
        acc.push({
          startDate: new Date(curr.timestamp),
          endDate: new Date(curr.timestamp),
          status: curr.status,
          days: 1,
        })
      } else {
        const lastGroup = acc[acc.length - 1]
        lastGroup.endDate = new Date(curr.timestamp)
        lastGroup.days += 1
      }
      return acc
    },
    []
  )

  const currentStatus = data[data.length - 1]?.status || "operational"

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{name}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>System uptime over the past 30 days</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${
              currentStatus === "operational"
                ? "text-emerald-500"
                : currentStatus === "degraded"
                  ? "text-yellow-500"
                  : "text-red-500"
            }`}
          >
            {getStatusLabel(currentStatus)}
          </span>
          <span className="text-sm text-muted-foreground">{uptime}% uptime</span>
        </div>
      </div>
      <div className="w-[420px]">
        <div className="relative">
          <div className="flex h-8">
            {data.slice(-60).map((day, i) => (
              <div 
                key={i} 
                className={`${getStatusColor(day.status)} h-full w-[6px]`} 
                style={{ marginRight: '1px' }}
              />
            ))}
          </div>
          {/* Hover overlay for grouped data */}
          <div className="flex absolute inset-0">
            {groupedData.map((group, i) => {
              const startCol = 60 - Math.ceil((Date.now() - group.startDate.getTime()) / (24 * 60 * 60 * 1000))
              const width = Math.min(group.days, 60 - startCol)

              return (
                <TooltipProvider key={i}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="h-full cursor-help"
                        style={{
                          width: `${width * 7 - 1}px`,
                          marginLeft: startCol > 0 ? `${startCol * 7}px` : 0
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">{getStatusLabel(group.status)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(group.startDate, "MMM d, yyyy")}
                          {group.days > 1 && ` - ${format(group.endDate, "MMM d, yyyy")}`}
                        </p>
                        {group.days > 1 && <p className="text-xs text-muted-foreground">Duration: {group.days} days</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground">60 days ago</span>
          <span className="text-xs text-muted-foreground">Today</span>
        </div>
      </div>
    </div>
  )
}

