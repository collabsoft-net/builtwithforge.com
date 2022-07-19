declare module '*.svg' {
  import React from 'react';
  const value: string;
  const ReactComponent: React.VFC<React.SVGProps<SVGSVGElement>>;
  export { ReactComponent };
  export default value;
}