import { isLitExp,VarDecl, makeLitExp, BoolExp, makePrimOp, IfExp, makeVarRef,makeBoolExp, makeVarDecl, isClassExp,
    makeClassExp, isLetExp, makeLetExp, makeBinding, Binding, ClassExp, ProcExp, Exp, Program, makeAppExp, makeProcExp, 
    isNumExp, isBoolExp, isPrimOp, isVarRef, isAppExp, CExp, isIfExp, makeIfExp, isProcExp, makeProgram, isDefineExp, makeDefineExp, isProgram, isExp } from "./L3-ast";
import {Result, bind, makeFailure, makeOk, mapResult, safe2} from "../shared/result";
import { first, rest, isEmpty } from "../shared/list";
import { map, zipWith } from "ramda";
import { makeSymbolSExp } from "../L3/L3-value";

/*
Purpose: Transform ClassExp to ProcExp
Signature: class2proc(classExp)
Type: ClassExp => ProcExp
*/
export const isNonEmptyList = <T>(list: T[]): list is [T, ...T[]] => list.length > 0;
export const class2proc = (exp: ClassExp): ProcExp =>{
    //@TODO
return makeProcExp(exp.fields,[makeProcExp([makeVarDecl('msg')],[constructIfExp(exp.methods)])]); }
//helper function thats Constructs nested if expressions from bindings.
const constructIfExp = (bindings: Binding[]): IfExp | BoolExp => 
    isNonEmptyList(bindings) ? 
        makeIfExp(makeAppExp(makePrimOp('eq?'), [makeVarRef('msg'), makeLitExp(makeSymbolSExp(bindings[0].var.var))]), 
            makeAppExp(bindings[0].val, []), 
                constructIfExp(bindings.slice(1))) : 
    makeBoolExp(false);
/*
Purpose: Transform all class forms in the given AST to procs
Signature: lexTransform(AST)
Type: [Exp | Program] => Result<Exp | Program>
*/

export const lexTransform = (exp: Exp | Program): Result<Exp | Program> =>
    //@TODO
    isProgram(exp) ? 
       bind(mapResult(rewriteExp, exp.exps), (exps: Exp[]) => 
            makeOk(makeProgram(exps))) :
    isExp(exp) ?
        rewriteExp(exp) :
    makeFailure("Never");

//helper function to rewrite a single class
const rewriteExp = (exp: Exp): Result<Exp> =>
    isDefineExp(exp) ? bind(lexTransformCExp(exp.val), (val: CExp) => makeOk(makeDefineExp(exp.var, val))) :
    lexTransformCExp(exp);

//helper function to rewrite all classExp
export const lexTransformCExp = (exp: Exp): Result<CExp> =>
    isNumExp(exp) ? makeOk(exp) :
    isBoolExp(exp) ? makeOk(exp) :
    isPrimOp(exp) ? makeOk(exp) :
    isVarRef(exp) ? makeOk(exp) :
    isAppExp(exp) ? safe2((rator: CExp, rands: CExp[]) => makeOk(makeAppExp(rator, rands)))
                        (lexTransformCExp(exp.rator), mapResult(lexTransformCExp, exp.rands)) :
    isIfExp(exp) ? bind(lexTransformCExp(exp.test), (test: CExp) =>
                    bind(lexTransformCExp(exp.then), (then: CExp) =>
                        bind(lexTransformCExp(exp.alt), (alt: CExp) =>
                            makeOk(makeIfExp(test, then, alt))))) :
    isProcExp(exp) ? bind(mapResult(lexTransformCExp, exp.body), (body: CExp[]) => makeOk(makeProcExp(exp.args, body))) :
    isLetExp(exp) ? safe2((vals: CExp[], body: CExp[]) =>
                        makeOk(makeLetExp(
                            zipWith(makeBinding, exp.bindings.map(binding => binding.var.var), vals),
                            body
                        ))
                    )(mapResult((binding: Binding) => lexTransformCExp(binding.val), exp.bindings), mapResult(lexTransformCExp, exp.body)) :
    isClassExp(exp) ? bind(mapResult((binding: Binding) => lexTransformCExp(binding.val), exp.methods),
                           (vals: CExp[]) => makeOk(
                               class2proc(
                                   makeClassExp(exp.fields, zipWith(makeBinding, exp.methods.map(binding => binding.var.var), vals))
                               )
                           )
                      ) :
    isLitExp(exp) ? makeOk(exp) :
    makeFailure(`Unexpected CExp: ${exp.tag}`);