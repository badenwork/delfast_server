%% Feel free to use, reuse and abuse the code in this file.

-module(echo_protocol).
-behaviour(ranch_protocol).

-export([start_link/4]).
-export([init/3]).

start_link(Ref, _Socket, Transport, Opts) ->
	Pid = spawn_link(?MODULE, init, [Ref, Transport, Opts]),
	{ok, Pid}.

init(Ref, Transport, Opts) ->
	io:format("Connect new client (~p)~n", [Opts]),
	{ok, Socket} = ranch:handshake(Ref),
	% Transport:send(Socket, <<"welcome\r\n">>),
	Packet = binary:list_to_bin(io_lib:format("welcome/~p~n", [Opts])),
	Transport:send(Socket, Packet),
	loop(Socket, Transport).

loop(Socket, Transport) ->
	case Transport:recv(Socket, 0, 500000) of
		{ok, Data} when Data =/= <<4>> ->
			io:format("Got data from client: ~p~n", [Data]),
			Transport:send(Socket, Data),
			loop(Socket, Transport);
		{error, timeout} ->
			io:format("Timeout, diconnection...~n", []),
			ok = Transport:close(Socket);
		Other ->
			io:format("Other ~p~n", [Other]),
			ok = Transport:close(Socket)
	end.
