import moment from "moment";

/**
 * 
 * @param month Zero indexed
 * @returns 
 */
export function getMonthNameFromNumber(month: number)
{
  const date = moment((month + 1).toString(), 'M');
  return date.format('MMMM');
}