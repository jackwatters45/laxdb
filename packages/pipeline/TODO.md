# TODO

## Bugs

- [ ] `getPlayerDetail` returns HTTP 400 - GraphQL query needs investigation (fragments may be incompatible with current API)
- [ ] `getTeamDetail` returns HTTP 400 - same issue as getPlayerDetail

## Improvements 

- Rate Limiting: The retry logic doesn't respect retryAfterMs from ApiRateLimitError - implement exponential backoff with rate limit hints
- Configuration: Consider making retry settings configurable per client instance, not just globally
- Add docs explaining we are basically wrapping external apis / scraping sites and then want to create a pipeline for processing data from these sources
- ~~Testing: Add unit tests with mocked HTTP responses using Effect's TestServices~~ DONE
