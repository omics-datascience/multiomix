import json
import logging
import os
import shutil

from django.conf import settings

logger = logging.getLogger(__name__)
VALID_TRANSPORTS = {'stdio', 'http', 'sse'}


def load_mcp_config() -> dict:
    """
    Reads, validates and returns the MCP server config as a dict compatible with
    MultiServerMCPClient.
    Returns {} if config is absent, malformed, or has no enabled servers.
    """
    config_path = getattr(settings, 'ASSISTANT_MCP_CONFIG_PATH', None)
    if not config_path:
        return {}
    if not os.path.exists(config_path):
        logger.warning('MCP config not found at: %s', config_path)
        return {}
    try:
        with open(config_path) as f:
            raw = json.load(f)
    except (json.JSONDecodeError, IOError) as exc:
        logger.error('Failed to read MCP config: %s', exc)
        return {}

    servers = raw.get('servers', {})
    if not isinstance(servers, dict):
        logger.error("MCP config 'servers' must be a dict")
        return {}

    result = {}
    for name, cfg in servers.items():
        if not cfg.get('enabled', True):
            continue
        transport = cfg.get('transport', '')
        if transport not in VALID_TRANSPORTS:
            logger.warning("MCP server '%s': invalid transport '%s', skipping", name, transport)
            continue
        if 'command' not in cfg:
            logger.warning("MCP server '%s': missing 'command', skipping", name)
            continue
        if transport == 'stdio' and not shutil.which(cfg['command']):
            logger.warning(
                "MCP server '%s': command '%s' not found in PATH, skipping",
                name,
                cfg['command'],
            )
            continue

        entry: dict = {'transport': transport, 'command': cfg['command']}
        if 'args' in cfg:
            entry['args'] = cfg['args']
        if cfg.get('env'):
            entry['env'] = cfg['env']
        if transport in ('http', 'sse') and 'url' in cfg:
            entry['url'] = cfg['url']
        result[name] = entry
        logger.info("MCP server '%s' loaded (transport=%s)", name, transport)

    return result
