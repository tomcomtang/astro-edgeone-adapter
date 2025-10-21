/**
 * 类型定义
 */

export interface EdgeOneAdapterOptions {
  /**
   * Output directory for EdgeOne Pages
   * @default '.edgeone'
   */
  outDir?: string;
}

export interface MetaConfig {
  conf: {
    headers: any[];
    redirects: any[];
    rewrites: any[];
    caches: any[];
    has404: boolean;
  };
  has404: boolean;
  nextRoutes: RouteConfig[];
}

export interface RouteConfig {
  path: string;
  isStatic?: boolean;
  srcRoute?: string;
  dataRoute?: string;
}

export interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

