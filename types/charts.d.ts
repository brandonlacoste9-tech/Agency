// Chart library type declarations
declare module 'react-apexcharts' {
  import { Component } from 'react';
  
  interface ApexChartProps {
    type?: string;
    options?: any;
    series?: any;
    width?: string | number;
    height?: string | number;
  }
  
  export default class ReactApexChart extends Component<ApexChartProps> {}
}

declare module 'echarts-for-react' {
  import { Component } from 'react';
  
  interface ReactEChartsProps {
    option?: any;
    style?: React.CSSProperties;
    className?: string;
    theme?: string;
    notMerge?: boolean;
    lazyUpdate?: boolean;
    opts?: any;
  }
  
  export default class ReactECharts extends Component<ReactEChartsProps> {}
}
