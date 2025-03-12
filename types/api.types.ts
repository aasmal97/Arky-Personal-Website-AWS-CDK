export const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST",
};
export const corsPostHeaders = {
  ...corsHeaders,
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};
