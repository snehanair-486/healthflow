// structured: JSON output with confidence + clarification
// queryMode:  'none' (agents get the original message)
//             'rewrite' (one standalone rewrite of the whole message)
//             'split' (one standalone sub-query per intent)
export const STRATEGIES = {
  baseline:   { structured: false, queryMode: 'none' },
  structured: { structured: true,  queryMode: 'none' },
  context:    { structured: true,  queryMode: 'rewrite' },
  full:       { structured: true,  queryMode: 'split' },
};