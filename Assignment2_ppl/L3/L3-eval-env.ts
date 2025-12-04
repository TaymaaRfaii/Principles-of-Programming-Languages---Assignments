// L3-eval.ts
// Evaluator with Environments model

import { map } from "ramda";
import { isBoolExp, isCExp, isLitExp, isNumExp, isPrimOp, isStrExp, isVarRef,
         isAppExp, isDefineExp, isIfExp, isLetExp, isProcExp,
         Binding, VarDecl, CExp, Exp, IfExp, LetExp, ProcExp, Program,
         parseL3Exp,  DefineExp} from "./L3-ast";
         import { applyEnv, makeEmptyEnv, makeExtEnv, Env } from "./L3-env-env";

         import { isClosure, makeClosureEnv, Closure, Value,Class,isClassExp,makeClassEnv,makeObject, makeObjectEnv,isObject, Object,isSymbolSExp } from "./L3-value";
import { applyPrimitive } from "./evalPrimitive";
import { allT, first, rest, isEmpty, isNonEmptyList } from "../shared/list";
import { Result, makeOk, makeFailure, bind, mapResult } from "../shared/result";
import { parse as p } from "../shared/parser";
import { format } from "../shared/format";

// ========================================================
// Eval functions

const applicativeEval = (exp: CExp, env: Env): Result<Value> =>
    isNumExp(exp) ? makeOk(exp.val) :
    isBoolExp(exp) ? makeOk(exp.val) :
    isStrExp(exp) ? makeOk(exp.val) :
    isPrimOp(exp) ? makeOk(exp) :
    isVarRef(exp) ? applyEnv(env, exp.var) :
    isLitExp(exp) ? makeOk(exp.val) :
    isIfExp(exp) ? evalIf(exp, env) :
    isProcExp(exp) ? evalProc(exp, env) :
    isLetExp(exp) ? evalLet(exp, env) :
    isClassExp(exp) ? evalClass(exp, env) : //Added
    isAppExp(exp) ? bind(applicativeEval(exp.rator, env),
                      (proc: Value) =>
                        bind(mapResult((rand: CExp) => 
                           applicativeEval(rand, env), exp.rands),
                              (args: Value[]) =>
                                 applyProcedure(proc, args))) :
    makeFailure('"let" not supported (yet)');

export const isTrueValue = (x: Value): boolean =>
    ! (x === false);

const evalIf = (exp: IfExp, env: Env): Result<Value> =>
    bind(applicativeEval(exp.test, env), (test: Value) => 
            isTrueValue(test) ? applicativeEval(exp.then, env) : 
            applicativeEval(exp.alt, env));

const evalProc = (exp: ProcExp, env: Env): Result<Closure> =>
    makeOk(makeClosureEnv(exp.args, exp.body, env));

// KEY: This procedure does NOT have an env parameter.
//      Instead we use the env of the closure.
const applyProcedure = (proc: Value, args: Value[]): Result<Value> =>
    isPrimOp(proc) ? applyPrimitive(proc, args) :
    isClosure(proc) ? applyClosure(proc, args) :
    isClassExp(proc) ? applyClass(proc, args) : 
    isObject(proc) ? applyObject(proc, args) :  

    makeFailure(`Bad procedure ${format(proc)}`);

const applyClosure = (proc: Closure, args: Value[]): Result<Value> => {
    const vars = map((v: VarDecl) => v.var, proc.params);
    return evalSequence(proc.body, makeExtEnv(vars, args, proc.env));
}

// Evaluate a sequence of expressions (in a program)
export const evalSequence = (seq: Exp[], env: Env): Result<Value> =>
    isNonEmptyList<Exp>(seq) ? evalCExps(first(seq), rest(seq), env) : 
    makeFailure("Empty sequence");
    
const evalCExps = (first: Exp, rest: Exp[], env: Env): Result<Value> =>
    isDefineExp(first) ? evalDefineExps(first, rest, env) :
    isCExp(first) && isEmpty(rest) ? applicativeEval(first, env) :
    isCExp(first) ? bind(applicativeEval(first, env), _ => evalSequence(rest, env)) :
    first;
    
// Eval a sequence of expressions when the first exp is a Define.
// Compute the rhs of the define, extend the env with the new binding
// then compute the rest of the exps in the new env.
const evalDefineExps = (def: DefineExp, exps: Exp[], env: Env): Result<Value> =>
    bind(applicativeEval(def.val, env), (rhs: Value) => 
            evalSequence(exps, makeExtEnv([def.var.var], [rhs], env)));


// Main program
export const evalL3program = (program: Program): Result<Value> =>
    evalSequence(program.exps, makeEmptyEnv());

export const evalParse = (s: string): Result<Value> =>
    bind(p(s), (x) => 
        bind(parseL3Exp(x), (exp: Exp) =>
            evalSequence([exp], makeEmptyEnv())));

// LET: Direct evaluation rule without syntax expansion
// compute the values, extend the env, eval the body.
const evalLet = (exp: LetExp, env: Env): Result<Value> => {
    const vals  = mapResult((v: CExp) => 
        applicativeEval(v, env), map((b: Binding) => b.val, exp.bindings));
    const vars = map((b: Binding) => b.var.var, exp.bindings);
    return bind(vals, (vals: Value[]) => 
        evalSequence(exp.body, makeExtEnv(vars, vals, env)));
}
//added :evalClass, applyClass , applyObject ____________________________________________________
const evalClass = (exp: Class, env: Env): Result<Class> =>
    makeOk(makeClassEnv(exp.fields, exp.methods, env));

const applyClass = (classVal: Class, args: Value[]): Result<Value> => 
    !isNonEmptyList(args) ? makeFailure('cannot create object without fields') :
    makeOk(makeObjectEnv(classVal.methods, makeExtEnv(map((f: VarDecl) => f.var, classVal.fields), args, classVal.env)));

const applyObject = (obj: Object, args: Value[]): Result<Value> => {
    if (!isNonEmptyList<Value>(args)) {
        return makeFailure("Missing method name parameter");
    }
    if (!isSymbolSExp(args[0])) {
        return makeFailure("Invalid method name")
    } 
    const selectedMethodName = args[0].val;
    const methodList = map((b: Binding) => b.var.var , obj.methods);
    if(!methodList.includes(selectedMethodName)) {
        return makeFailure(`Unrecognized method: ${selectedMethodName}`)
    }
    const chosenMethod = obj.methods[methodList.indexOf(selectedMethodName)];
    const methodArg = rest(args);
    return bind(applicativeEval(chosenMethod.val, obj.env), (v: Value) => applyProcedure(v, methodArg));
}
