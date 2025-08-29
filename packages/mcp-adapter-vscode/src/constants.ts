
export const EXT_KEYID = 'mcpVscodeAdapter'

function withPrefix(cmdKey: string) {
    return `${EXT_KEYID}.${cmdKey}`
}

export const COMMANDS_MAP = {
    HELLO_WORLD: withPrefix('helloWorld')
}

export const CONFIGURATIONS_MAP = {
    WS_SERVER_URL: withPrefix('wsServerUrl')
}