import moment from "moment";

/**
 * 0 indexed
 */
export function getMonthNameFromNumber(month: number)
{
  return moment(month.toString(), 'M').format('MMMM');
}