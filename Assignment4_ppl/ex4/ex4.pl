/*
 * **********************************************
 * Printing result depth
 *
 * You can enlarge it, if needed.
 * **********************************************
 */
maximum_printing_depth(100).

:- current_prolog_flag(toplevel_print_options, A),
   (select(max_depth(_), A, B), ! ; A = B),
   maximum_printing_depth(MPD),
   set_prolog_flag(toplevel_print_options, [max_depth(MPD)|B]).


% Signature: path(Node1, Node2, Path)/3
% Purpose: Path is a path, denoted by a list of nodes, from Node1 to Node2.
path(X,Y,[X,Y]):- edge(X,Y).
path(X,Y, [X | Tail]):- edge(X,Z), path(Z,Y, Tail).


% Signature: cycle(Node, Cycle)/2
% Purpose: Cycle is a cyclic path, denoted a list of nodes, from Node1 to Node1.

cycle(N, Cyc):- path(N, N, Cyc).


% Signature: reverse(Graph1,Graph2)/2
% Purpose: The edges in Graph1 are reversed in Graph2
reverse([],[]).
reverse([[N1,N2] |T], [[N2,N1] | R]):- reverse(T,R).



% Signature: degree(Node, Graph, Degree)/3
% Purpose: Degree is the degree of node Node, denoted by a Church number (as defined in class)
degree(_, [], zero).
degree(X, [[X,_]|Rest], s(D)):- degree(X,Rest,D).
degree(X, [[Y, _]|Rest], D ):- X\=Y, degree(X, Rest, D).

