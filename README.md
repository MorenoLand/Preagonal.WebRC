<p align="center">
  <img src="images/rcicon.png" alt="Preagonal WebRC" width="72">
</p>

<p align="center">A browser-based control surface for the Preagonal GameServer.</p>

## About

Preagonal WebRC is the React front end for the GameServer remote-control API. It keeps the familiar RC layout in a browser: connection controls, chat, players, servers, file management, server configuration, flags, weapons, NPCs, and classes.

The current release is the front-end foundation. The panels, navigation, typed API boundary, and empty/error states are in place, while the browser remains intentionally inert until API integration is enabled. Routes that are not present in the GameServer API are represented as explicit unavailable operations instead of guessed requests.

## Development

You need Node.js 20 or newer and npm.

```sh
npm install
npm run dev
```

The development server prints its local URL when it starts.

## Checks

```sh
npm test
npm run build
```

`npm test` runs the Vitest and React Testing Library suite. `npm run build` performs the TypeScript check and produces the Vite production build.

## Project shape

- `src/components` contains the shell, navigation, connection panel, workspace, tables, editors, and empty states.
- `src/api/gameServerApi.ts` is the typed boundary for the GameServer v1 API.
- `src/navigation.ts` defines the RC information architecture in one place.
- `images` contains the small project icon used by the shell and README.

## API boundary

The adapter knows the GameServer v1 routes currently available for login, files, scripts, and statistics. Chat, players, server settings, folder configuration, flags, weapons, NPCs, and classes remain explicit stubs until their server endpoints are available. No endpoint names are inferred by the web client.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the local checks and pull-request expectations.

## License

This project is available under the Mozilla Public License 2.0. See [LICENSE](LICENSE).
