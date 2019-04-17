export const dateToJson = timestamp => {
  const add0 = m => m < 10 ? '0' + m : m

  const time = new Date(timestamp)
  const years = time.getFullYear()
  const months = time.getMonth() + 1
  const days = time.getDate()
  const hours = time.getHours()
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()

  let dateDescStr = ''

  const date = new Date()
  const today = {
    years: date.getFullYear(),
    months: date.getMonth() + 1,
    days: date.getDate(),
  }

  if (
    years === today.years
      && months === today.months
      && days === today.days
  ) {
    dateDescStr = '今天'
  }

  date.setDate(date.getDate() - 1)

  const yesterday = {
    years: date.getFullYear(),
    months: date.getMonth() + 1,
    days: date.getDate(),
  }

  if (
    years === yesterday.years
      && months === yesterday.months
      && days === yesterday.days
  ) {
    dateDescStr = '昨天'
  }

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    dateStr: dateDescStr || `${years}-${add0(months)}-${add0(days)}`,
    timeStr: `${add0(hours)}:${add0(minutes)}`,
  }
}