import express from 'express'
import pino from 'pino'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import handler from './lib/config/handler.js'
import { defaultHost, defaultLogLevel, defaultPort } from './lib/config/default.js'
import middlewaresAssembler from './lib/middlewares/assembler.js'
import applyMiddlewares from './lib/middlewares/apply.js'
import templateEngine from './lib/templateEngine.js'

/**
 * Create a new Trifid instance.
 *
 * @param {{
 *   extends?: string[];
 *   server?: {
 *     listener: {
 *       host?: string;
 *       port?: number | string;
 *     };
 *     logLevel?: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
 *     express?: Record<string, any>;
 *   };
 *   globals?: Record<string, any>;
 *   template?: Record<string, any>;
 *   middlewares?: Record<string, {
 *     order?: number,
 *     module: string;
 *     paths?: string | string[];
 *     methods?: string | string[];
 *     hosts?: string | string[];
 *     config?: Record<string, any>;
 *   }>;
 * }}?} config Trifid configuration.
 * @param {Record<string, {
 *   order?: number,
 *   module: (trifid: {logger: any; server: unknown; config: Record<string, any>}) => Promise<()> | ();
 *   paths?: string | string[];
 *   methods?: string | string[];
 *   hosts?: string | string[];
 *   config?: Record<string, any>;
 * }?} additionalMiddlewares Add additional middlewares.
 * @returns {Promise<{
 *  start: () => void;
 *  server: unknown;
 *  config: {{
 *   server?: {
 *     listener: {
 *       host?: string;
 *       port?: number | string;
 *     };
 *     logLevel?: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
 *     express?: Record<string, any>;
 *   };
 *   globals?: Record<string, any>;
 *   template?: Record<string, any>;
 *   middlewares?: Record<string, {
 *     order?: number,
 *     module: string;
 *     paths?: string | string[];
 *     methods?: string | string[];
 *     hosts?: string | string[];
 *     config?: Record<string, any>;
 *   }>;
 * }}
 * >}}
 */
const trifid = async (config, additionalMiddlewares = {}) => {
  const fullConfig = await handler(config)
  const server = express()
  server.disable('x-powered-by')

  // add required middlewares
  server.use(cors({
    credentials: true,
    origin: true
  }))
  server.use(cookieParser())

  // configure Express server
  if (fullConfig?.server?.express) {
    for (const expressSettingKey in fullConfig.server.express) {
      server.set(expressSettingKey, fullConfig.server.express[expressSettingKey])
    }
  }

  // dynamic server configuration
  const port = fullConfig?.server?.listener?.port || defaultPort
  const host = fullConfig?.server?.listener?.host || defaultHost

  // logger configuration
  const logLevel = fullConfig?.server?.logLevel || defaultLogLevel

  // template configuration
  const template = fullConfig?.template || {}

  const logger = pino({
    name: 'trifid-core',
    level: logLevel,
    transport: {
      target: 'pino-pretty'
    }
  })

  const templateEngineInstance = await templateEngine(template)
  const middlewares = await middlewaresAssembler(fullConfig, additionalMiddlewares)
  await applyMiddlewares(server, fullConfig.globals, middlewares, logger, templateEngineInstance)

  const start = () => {
    server.listen(port, host, () => {
      logger.info(`Trifid instance listening on: http://${host}:${port}/`)
    })
  }

  return {
    start,
    server,
    config: fullConfig
  }
}

export default trifid
