export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({
    bricklink:Boolean(process.env.BRICKLINK_CONSUMER_KEY&&process.env.BRICKLINK_CONSUMER_SECRET&&process.env.BRICKLINK_TOKEN_VALUE&&process.env.BRICKLINK_TOKEN_SECRET),
    brickeconomy:Boolean(process.env.BRICKECONOMY_API_KEY),
    rebrickable:Boolean(process.env.REBRICKABLE_API_KEY),
    ebay:Boolean(process.env.EBAY_CLIENT_ID&&process.env.EBAY_CLIENT_SECRET)
  });
}
