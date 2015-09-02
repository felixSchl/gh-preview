import path from 'path';
import woody from 'woody';
import Server from './Server';
import docoptmd from 'docoptmd';

const logger = woody
  .as(woody.bracketed())
  .to(woody.console)
  .fork(woody.level())
  .fork(woody.timestamp());

const args = docoptmd(path.resolve(__dirname, '..'))
    , port = parseInt(args['--port'])
    , server = new Server(logger.fork('Server'));

server.listen(port);
