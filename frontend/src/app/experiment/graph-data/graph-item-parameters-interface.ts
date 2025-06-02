export interface GraphItemParameters {
    type: GraphItemType,
    bandwidth: string,
    delay: string,
    ipAddress: string,
    operatingSystem: string,
    hardwareType: string,
    nodeName: string,
    num: string
}

export enum GraphItemType {
    NODE = 0,
    LINK = 1,
    LAN = 2
}