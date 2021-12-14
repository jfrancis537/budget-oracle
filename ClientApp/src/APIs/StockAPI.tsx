export async function GetStockPriceNow(symbol: string): Promise<number | undefined>
{
  const url = `/api/stock/price/${symbol}`;
  let response = await fetch(url);
  if(response.ok)
  {
    return Number(await response.text())
  } else if(response.status === 404)
  {
    return undefined;
  } else {
    throw new Error("Failed to get stock price");
  }
}