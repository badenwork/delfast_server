-module(delfast_server_app).
-behaviour(application).

-export([start/2]).
-export([stop/1]).

start(_Type, _Args) ->

	{ok, Config} = file:read_file("/home/baden/.config/delfast_server/config.txt"),
	io:format("Config: ~s~n", [Config]),
	% {KeyFile, CertFile, CACertFile} = get_certs(Config),

	io:format("Start simple echo server at port :5555~n"),

	{ok, _} = ranch:start_listener(delfast_server_tcp,
		ranch_tcp, [{port, 5555}], echo_protocol, [tcp]),

	io:format("Start TLS echo server at port :8000 (TBD)~n"),

	{ok, _} = ranch:start_listener(delfast_server_tls,
		ranch_ssl, [
			{port, 8000},
			{keyfile, "/home/baden/.config/delfast_server/certs/server/server.key"},
			{certfile, "/home/baden/.config/delfast_server/certs/server/server.crt"},
			{cacertfile, "/home/baden/.config/delfast_server/certs/ca/ca.crt"},
			{verify, verify_peer}
		], echo_protocol, [ssl]),

	delfast_server_sup:start_link().

stop(_State) ->
	ok.

% Private

% get_certs(<<"client", _/Binary>>) ->
% 	{
% 		"/home/baden/.config/delfast_server/certs/server/server.key",
% 		"/home/baden/.config/delfast_server/certs/server/server.crt",
% 		"/home/baden/.config/delfast_server/certs/ca/ca.crt"
% 	}.
