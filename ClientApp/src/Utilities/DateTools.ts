import moment from "moment";

/**
 * 0 indexed
 */
export function getMonthNameFromNumber(month: number)
{
  const date = moment(month.toString(), 'M');
  console.log(date);
  return date.format('MMMM');
}