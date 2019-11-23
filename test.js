

async function macd()
{
    let macd = await require('./alphavantage_ea').macd("EURUSD","60min",100);
    console.log(macd);
}

macd();
