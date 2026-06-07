export type RouteHeader = {
  title: string;
  subtitle?: string;
  backTo?: string;
};

export type RouteHandle = {
  showNav?: boolean;
  centered?: boolean;
  header?: RouteHeader;
};

declare module "react-router-dom" {
  interface RouteMatch {
    handle?: RouteHandle;
  }
}
