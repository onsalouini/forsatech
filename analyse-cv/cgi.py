"""Minimal cgi.parse_header compatibility shim for Python 3.13.

This module exists only to support packages that still import cgi.parse_header.
"""

from email.message import Message


def parse_header(line):
    """Parse a Content-type like header.

    Returns (value, params_dict), compatible with legacy cgi.parse_header.
    """
    msg = Message()
    msg["content-type"] = line
    value = msg.get_content_type()
    params = dict(msg.get_params(header="content-type", unquote=True)[1:])
    return value, params
