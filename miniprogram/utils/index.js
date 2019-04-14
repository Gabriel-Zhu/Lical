export const dateToJson = timestamp => {
  const add0 = m => m < 10 ? '0' + m : m

  const time = new Date(timestamp)
  const years = time.getFullYear()
  const months = time.getMonth() + 1
  const days = time.getDate()
  const hours = time.getHours()
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    dateStr: `${years}-${add0(months)}-${add0(days)}`,
    timeStr: `${add0(hours)}:${add0(minutes)}`,
  }
}