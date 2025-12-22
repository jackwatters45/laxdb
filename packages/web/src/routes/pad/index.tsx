// import { Result, useAtomValue } from '@effect-atom/atom-react';
// import {
//   HttpGameClientAtom,
//   RpcGameClient,
//   RpcGameClientAtom,
// } from '@laxdb/api/game/game.client';
// import { GetAllGamesInput } from '@laxdb/core/game/game.schema';
// import { GameService } from '@laxdb/core/game/game.service';
// import { RuntimeServer } from '@laxdb/core/runtime.server';
// import { GetAllSeasonsInput } from '@laxdb/core/season/season.schema';
// import { SeasonService } from '@laxdb/core/season/season.service';
// import { createFileRoute } from '@tanstack/react-router';
// import { createServerFn } from '@tanstack/react-start';
// import { Cause, Effect, Schema } from 'effect';
// import { RuntimeAtom } from '@/lib/runtime.atom';
// import { CreateGameForm } from './-create-game-form';
// import { CreateSeasonForm } from './-create-season-form';

// const ORG_ID = 'YRGXnzwJrEam1sK8ZzJUErm1cFIB2V9W';
// const TEAM_ID = 'zMdIMZuQEfe0ec3lsK6a8YhwHysRcvq5';

// const getAllSeasons = createServerFn({ method: 'GET' })
//   .inputValidator((data: GetAllSeasonsInput) =>
//     Schema.decodeSync(GetAllSeasonsInput)(data)
//   )
//   .handler(async ({ data }) =>
//     RuntimeServer.runPromise(
//       Effect.gen(function* () {
//         const seasonService = yield* SeasonService;
//         return yield* seasonService.list(data);
//       })
//     )
//   );

// const getAllGames = createServerFn({ method: 'GET' })
//   .inputValidator((data: GetAllGamesInput) =>
//     Schema.decodeSync(GetAllGamesInput)(data)
//   )
//   .handler(async ({ data }) =>
//     RuntimeServer.runPromise(
//       Effect.gen(function* () {
//         const gameService = yield* GameService;
//         return yield* gameService.getAll(data);
//       })
//     )
//   );

// export const Route = createFileRoute('/pad/')({
//   component: RouteComponent,
//   loader: async () => {
//     const seasons = await getAllSeasons({
//       data: {
//         organizationId: ORG_ID,
//         teamId: TEAM_ID,
//       },
//     });
//     const games = await getAllGames({
//       data: {
//         organizationId: ORG_ID,
//         teamId: TEAM_ID,
//       },
//     });

//     return { seasons, games };
//   },
// });

// const gameAtom = RuntimeAtom.atom(
//   Effect.gen(function* () {
//     const client = yield* RpcGameClient;
//     return yield* client.GameList();
//   })
// );

// // add players selector for like quick adding to seasons, teams when creating
// function RouteComponent() {
//   const data = Route.useLoaderData();

//   const gameRpcResult = useAtomValue(gameAtom);

//   const gameRpcResultAtomic = useAtomValue(
//     RpcGameClientAtom.query('GameList', void 0, {
//       reactivityKeys: ['GameList'],
//     })
//   );

//   const gameRpcResultHttp = useAtomValue(
//     HttpGameClientAtom.query('Games', 'getGames', {
//       // You can register reactivity keys, which can be used to invalidate
//       // the query
//       reactivityKeys: ['GameList'],
//     })
//   );

//   console.log({ gameRpcResultHttp });

//   return (
//     <div>
//       <section>
//         <div>Results</div>
//         <div>{JSON.stringify(data, null, 4)}</div>
//       </section>
//       <section>
//         <div>Atom Results</div>
//         {Result.match(gameRpcResult, {
//           onInitial: () => <div>Loading...</div>,
//           onFailure: (error) => <div>Error: {Cause.pretty(error.cause)}</div>,
//           onSuccess: (success) => (
//             <div>
//               <ul>
//                 {success.value.map((game) => (
//                   <li key={game.id}>{game.name}</li>
//                 ))}
//               </ul>
//             </div>
//           ),
//         })}
//       </section>
//       <section>
//         <div>Atom Results</div>
//         {Result.match(gameRpcResultAtomic, {
//           onInitial: () => <div>Loading...</div>,
//           onFailure: (error) => <div>Error: {Cause.pretty(error.cause)}</div>,
//           onSuccess: (success) => (
//             <div>
//               <ul>
//                 {success.value.map((game) => (
//                   <li key={game.id}>{game.name}</li>
//                 ))}
//               </ul>
//             </div>
//           ),
//         })}
//       </section>
//       <section>
//         <div>Http Results</div>
//         {Result.match(gameRpcResultHttp, {
//           onInitial: () => <div>Loading...</div>,
//           onFailure: (error) => <div>Error: {Cause.pretty(error.cause)}</div>,
//           onSuccess: (success) => (
//             <div>
//               <ul>
//                 {success.value.map((game) => (
//                   <li key={game.id}>{game.name}</li>
//                 ))}
//               </ul>
//             </div>
//           ),
//         })}
//       </section>
//       <CreateSeasonForm organizationId={ORG_ID} teamId={TEAM_ID} />
//       <CreateGameForm organizationId={ORG_ID} />
//       <section />
//     </div>
//   );
// }
