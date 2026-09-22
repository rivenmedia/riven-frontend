import {
  $ as t,
  B as n,
  F as r,
  G as i,
  H as a,
  J as o,
  K as s,
  P as c,
  Q as l,
  R as ee,
  U as te,
  V as ne,
  W as re,
  X as ie,
  Y as ae,
  Z as oe,
  at as se,
  ct as ce,
  dt as u,
  et as le,
  ft as d,
  it as ue,
  lt as f,
  nt as de,
  ot as fe,
  q as pe,
  rt as me,
  st as he,
  tt as ge,
  ut as p,
  z as _e,
} from "./iframe-DQKhfIee.js";
import { i as e } from "./preload-helper-xPQekRTU.js";
var ve,
  ye = e(() => {
    ve = class {
      #e;
      #t;
      constructor() {
        ((this.#e = []), (this.#t = new Map()));
      }
      get [Symbol.iterator]() {
        return this.#e[Symbol.iterator].bind(this.#e);
      }
      entries() {
        return this.#t.entries();
      }
      get(e) {
        return this.#t.get(e) || [];
      }
      getAll() {
        return this.#e.map(([, e]) => e);
      }
      append(e, t) {
        (this.#e.push([e, t]), this.#n(e, (e) => e.push(t)));
      }
      prepend(e, t) {
        (this.#e.unshift([e, t]), this.#n(e, (e) => e.unshift(t)));
      }
      delete(e, t) {
        if (this.size === 0) return !1;
        let n = this.#t.get(e);
        if (!n) return !1;
        let r = n.indexOf(t);
        return r === -1
          ? !1
          : (n.splice(r, 1),
            this.#e.splice(
              this.#e.findIndex((n) => n[0] === e && n[1] === t),
              1,
            ),
            !0);
      }
      deleteAll(e) {
        this.size !== 0 &&
          ((this.#e = this.#e.filter((t) => t[0] !== e)), this.#t.delete(e));
      }
      get size() {
        return this.#e.length;
      }
      clear() {
        this.size !== 0 && ((this.#e.length = 0), this.#t.clear());
      }
      #n(e, t) {
        t(this.#t.get(e) || this.#t.set(e, []).get(e));
      }
    };
  }),
  m,
  h,
  g,
  _,
  be,
  v = e(() => {
    (ye(),
      (m = Symbol(`kDefaultPrevented`)),
      (h = Symbol(`kPropagationStopped`)),
      (g = Symbol(`kImmediatePropagationStopped`)),
      (_ = class extends MessageEvent {
        [m];
        [h];
        [g];
        constructor(...e) {
          (super(e[0], e[1]), (this[m] = !1));
        }
        get defaultPrevented() {
          return this[m];
        }
        preventDefault() {
          (super.preventDefault(), (this[m] = !0));
        }
        stopImmediatePropagation() {
          (super.stopImmediatePropagation(), (this[g] = !0));
        }
      }),
      (be = class {
        #e;
        #t;
        #n;
        #r;
        #i;
        #a;
        #o;
        hooks;
        constructor() {
          ((this.#e = new ve()),
            (this.#t = new WeakMap()),
            (this.#n = new WeakMap()),
            (this.#r = new WeakSet()),
            (this.#i = new ve()),
            (this.#a = new WeakMap()),
            (this.#o = new WeakMap()),
            (this.hooks = {
              on: (e, t, n) => {
                if (!n?.signal?.aborted) {
                  if (n?.once) {
                    let n = t,
                      r = (...t) => (this.#s(e, r), n(...t));
                    t = r;
                  }
                  if (
                    (this.#i.append(e, t), n && this.#a.set(t, n), n?.signal)
                  ) {
                    let { signal: r } = n,
                      i = () => {
                        this.#s(e, t);
                      };
                    (r.addEventListener(`abort`, i, { once: !0 }),
                      this.#o.set(t, () => {
                        r.removeEventListener(`abort`, i);
                      }));
                  }
                }
              },
              removeListener: (e, t) => {
                this.#s(e, t);
              },
            }));
        }
        #s(e, t) {
          this.#i.delete(e, t);
          let n = this.#o.get(t);
          n && (n(), this.#o.delete(t));
        }
        #c(e, t) {
          let n = this.#e.delete(e, t),
            r = this.#n.get(t);
          return (r && (r(), this.#n.delete(t)), n);
        }
        on(e, t, n) {
          return (this.#l(e, t, n), this);
        }
        once(e, t, n) {
          return this.on(e, t, { ...(n || {}), once: !0 });
        }
        earlyOn(e, t, n) {
          return (this.#l(e, t, n, `prepend`), this);
        }
        earlyOnce(e, t, n) {
          return this.earlyOn(e, t, { ...(n || {}), once: !0 });
        }
        emit(e) {
          if (this.#e.size === 0) return !1;
          let t = this.listenerCount(e.type) > 0,
            n = this.#u(e);
          for (let t of this.#f(e.type)) {
            if (n.event[h] != null && n.event[h] !== this)
              return (n.revoke(), !1);
            if (n.event[g]) break;
            this.#d(n.event, t);
          }
          return (n.revoke(), t);
        }
        async emitAsPromise(e) {
          if (this.#e.size === 0) return [];
          let t = [],
            n = this.#u(e);
          for (let r of this.#f(e.type)) {
            if (n.event[h] != null && n.event[h] !== this)
              return (n.revoke(), []);
            if (n.event[g]) break;
            let e = await Promise.resolve(this.#d(n.event, r));
            this.#p(r) || t.push(e);
          }
          return (
            n.revoke(),
            Promise.allSettled(t).then((e) =>
              e.map((e) => (e.status === `fulfilled` ? e.value : e.reason)),
            )
          );
        }
        *emitAsGenerator(e) {
          if (this.#e.size === 0) return;
          let t = this.#u(e);
          for (let n of this.#f(e.type)) {
            if (t.event[h] != null && t.event[h] !== this) {
              t.revoke();
              return;
            }
            if (t.event[g]) break;
            let e = this.#d(t.event, n);
            this.#p(n) || (yield e);
          }
          t.revoke();
        }
        removeListener(e, t) {
          let n = this.#t.get(t);
          if (this.#c(e, t))
            for (let r of this.#i.get(`removeListener`).slice()) r(e, t, n);
        }
        removeAllListeners(e) {
          if (e == null) {
            for (let [e, t] of this.#e.entries())
              for (; t.length > 0;) this.removeListener(e, t[0]);
            for (let [e, t] of [...this.#i])
              this.#a.get(t)?.persist || this.#s(e, t);
            return;
          }
          let t = this.listeners(e);
          for (; t.length > 0;) this.removeListener(e, t[0]);
        }
        listeners(e) {
          return e == null ? this.#e.getAll() : this.#e.get(e);
        }
        listenerCount(e) {
          return e == null ? this.#e.size : this.listeners(e).length;
        }
        #l(e, t, n, r = `append`) {
          if (!n?.signal?.aborted) {
            for (let r of this.#i.get(`newListener`).slice()) r(e, t, n);
            if (
              (e === `*` && this.#r.add(t),
              r === `prepend` ? this.#e.prepend(e, t) : this.#e.append(e, t),
              n && (this.#t.set(t, n), n.signal))
            ) {
              let { signal: r } = n,
                i = () => {
                  this.removeListener(e, t);
                };
              (r.addEventListener(`abort`, i, { once: !0 }),
                this.#n.set(t, () => {
                  r.removeEventListener(`abort`, i);
                }));
            }
          }
        }
        #u(e) {
          let { stopPropagation: t } = e;
          return (
            (e.stopPropagation = () => {
              ((e[h] = this), t.call(e));
            }),
            {
              event: e,
              revoke() {
                e.stopPropagation = t;
              },
            }
          );
        }
        #d(e, t) {
          for (let t of this.#i.get(`beforeEmit`).slice())
            if (t(e) === !1) return;
          let n = t.call(this, e),
            r = this.#t.get(t);
          if (r?.once) {
            let n = this.#p(t) ? `*` : e.type;
            if (this.#c(n, t))
              for (let e of this.#i.get(`removeListener`).slice()) e(n, t, r);
          }
          return n;
        }
        *#f(e) {
          let t = [];
          for (let [n, r] of this.#e) (n === `*` || n === e) && t.push(r);
          yield* t;
        }
        #p(e) {
          return this.#r.has(e);
        }
      }));
  });
function xe(e) {
  return typeof e == `object` && !!e && !Array.isArray(e);
}
var Se = e(() => {});
function Ce(e) {
  return Reflect.get(e, we) || [];
}
var we,
  Te = e(() => {
    (u(), (we = Symbol(`kSiblingHandlers`)));
  });
function Ee(e) {
  let t = {},
    n = (e, n) => {
      let r = (t[e] ||= []);
      r.includes(n) || r.push(n);
    };
  for (let t of e) {
    n(t.kind, t);
    for (let e of Ce(t)) n(e.kind, e);
  }
  return t;
}
var De,
  Oe,
  ke = e(() => {
    (u(),
      p(),
      Te(),
      (De = class {
        getInitialState(e) {
          d(
            this.#e(e),
            f.formatMessage(
              `Failed to apply given request handlers: invalid input. Did you forget to spread the request handlers Array?`,
            ),
          );
          let t = Ee(e);
          return { initialHandlers: t, handlers: { ...t } };
        }
        currentHandlers() {
          return Object.values(this.getState().handlers)
            .flat()
            .filter((e) => e != null);
        }
        getHandlersByKind(e) {
          return this.getState().handlers[e] || [];
        }
        use(e) {
          if (
            (d(
              this.#e(e),
              f.formatMessage(
                `[MSW] Failed to call "use()" with the given request handlers: invalid input. Did you forget to spread the array of request handlers?`,
              ),
            ),
            e.length === 0)
          )
            return;
          let { handlers: t } = this.getState(),
            n = Ee(e);
          for (let e in n) {
            let r = n[e],
              i = t[e];
            t[e] = i ? [...r, ...i] : r;
          }
          this.setState({ handlers: t });
        }
        reset(e) {
          d(
            e.length > 0 ? this.#e(e) : !0,
            f.formatMessage(
              `Failed to replace initial handlers during reset: invalid handlers. Did you forget to spread the handlers array?`,
            ),
          );
          for (let e of this.currentHandlers()) `reset` in e && e.reset();
          let { initialHandlers: t } = this.getState();
          if (e.length === 0) {
            this.setState({ handlers: { ...t } });
            return;
          }
          let n = Ee(e);
          this.setState({ initialHandlers: n, handlers: { ...n } });
        }
        restore() {
          for (let e of this.currentHandlers()) `restore` in e && e.restore();
        }
        #e(e) {
          return e.every((e) => !Array.isArray(e));
        }
      }),
      (Oe = class extends De {
        #e;
        #t;
        constructor(e) {
          super();
          let t = this.getInitialState(e);
          ((this.#t = t.initialHandlers), (this.#e = t.handlers));
        }
        getState() {
          return { initialHandlers: this.#t, handlers: this.#e };
        }
        setState(e) {
          (e.initialHandlers && (this.#t = e.initialHandlers),
            e.handlers && (this.#e = e.handlers));
        }
      }));
  }),
  Ae,
  je = e(() => {
    (p(),
      (Ae = class {
        subscriptions = [];
        dispose() {
          let e,
            t = [];
          for (; (e = this.subscriptions.shift());)
            try {
              e();
            } catch (e) {
              e instanceof Error && t.push(e);
            }
          t.length > 0 &&
            console.error(
              AggregateError(
                t,
                f.formatMessage(
                  `Failed to dispose of some side effects. This is likely an issue with MSW, please report it on GitHub: https://github.com/mswjs/msw/issues`,
                ),
              ),
            );
        }
      }));
  });
function Me(e) {
  let t = [...e];
  return (Object.freeze(t), t);
}
var Ne = e(() => {});
async function Pe(e) {
  try {
    return [
      null,
      await e().catch((e) => {
        throw e;
      }),
    ];
  } catch (e) {
    return [e, null];
  }
}
var Fe = e(() => {});
async function Ie(e, t) {
  let n = oe(t);
  n && (await ee.setCookie(n, e.url));
}
var Le = e(() => {
    (_e(), l());
  }),
  Re,
  ze = e(() => {
    (v(),
      (Re = class {
        constructor(e, t) {
          ((this.protocol = e), (this.data = t), (this.events = new be()));
        }
        protocol;
        data;
        events;
      }));
  }),
  Be,
  Ve,
  He = e(() => {
    (v(),
      (Be = class extends _ {
        frame;
        constructor(e, t) {
          (super(e, {}), (this.frame = t));
        }
      }),
      (Ve = class {
        emitter;
        constructor() {
          this.emitter = new be();
        }
        async queue(e) {
          await this.emitter.emitAsPromise(new Be(`frame`, e));
        }
        on(e, t, n) {
          this.emitter.on(e, t, n);
        }
        disable() {
          this.emitter.removeAllListeners();
        }
      }));
  });
function Ue(e) {
  return !!e.headers.get(`accept`)?.includes(`msw/passthrough`);
}
function We(e) {
  return e.status === 302 && e.headers.get(`x-msw-intention`) === `passthrough`;
}
function Ge(e) {
  let t = e.headers.get(`accept`);
  if (t) {
    let n = t.replace(/(,\s+)?msw\/passthrough/, ``);
    n ? e.headers.set(`accept`, n) : e.headers.delete(`accept`);
  }
}
var Ke = e(() => {}),
  y,
  qe,
  Je,
  Ye,
  Xe = e(() => {
    (v(),
      Fe(),
      le(),
      ze(),
      i(),
      ne(),
      Le(),
      Ke(),
      p(),
      Qe(),
      (y = class extends _ {
        requestId;
        request;
        constructor(e, t) {
          (super(e, {}),
            (this.requestId = t.requestId),
            (this.request = t.request));
        }
      }),
      (qe = class extends _ {
        requestId;
        request;
        response;
        constructor(e, t) {
          (super(e, {}),
            (this.requestId = t.requestId),
            (this.request = t.request),
            (this.response = t.response));
        }
      }),
      (Je = class extends _ {
        error;
        requestId;
        request;
        constructor(e, t) {
          (super(e, {}),
            (this.error = t.error),
            (this.requestId = t.requestId),
            (this.request = t.request));
        }
      }),
      (Ye = class extends Re {
        constructor(e) {
          let t = e.id || fe();
          super(`http`, { id: t, request: e.request });
        }
        getHandlers(e) {
          return e.getHandlersByKind(`request`);
        }
        async getUnhandledMessage() {
          let { request: e } = this.data,
            t = new URL(e.url),
            n = s(t) + t.search,
            r = e.body == null ? null : await e.clone().text();
          return `intercepted a request without a matching request handler:${`

  \u2022 ${e.method} ${n}

${
  r
    ? `  \u2022 Request body: ${r}

`
    : ``
}`}If you still wish to intercept this unhandled request, please create a request handler for it.
Read more: https://mswjs.io/docs/http/intercepting-requests`;
        }
        async resolve(e, t, r) {
          let { id: i, request: a } = this.data,
            o = r?.quiet ? null : a.clone();
          if (
            (this.events.emit(
              new y(`request:start`, { requestId: i, request: a }),
            ),
            Ue(a))
          )
            return (
              this.events.emit(
                new y(`request:end`, { requestId: i, request: a }),
              ),
              this.passthrough(),
              null
            );
          let [s, c] = await Pe(() =>
            n({
              requestId: i,
              request: a,
              handlers: e,
              resolutionContext: {
                baseUrl: r?.baseUrl?.toString(),
                quiet: r?.quiet,
              },
            }),
          );
          if (s != null)
            return (
              this.events.emit(
                new Je(`unhandledException`, {
                  error: s,
                  requestId: i,
                  request: a,
                }),
              ) ||
                (console.error(s),
                f.error(
                  `Encountered an unhandled exception during the handler lookup for "%s %s". Please see the original error above.`,
                  a.method,
                  a.url,
                )),
              this.errorWith(s),
              null
            );
          if (c == null)
            return (
              this.events.emit(
                new y(`request:unhandled`, { requestId: i, request: a }),
              ),
              await Ze(this, t).then(
                () => this.passthrough(),
                (e) => this.errorWith(e),
              ),
              this.events.emit(
                new y(`request:end`, { requestId: i, request: a }),
              ),
              !1
            );
          let { response: l, handler: ee, parsedResult: te } = c;
          if (
            (this.events.emit(
              new y(`request:match`, { requestId: i, request: a }),
            ),
            l == null || We(l))
          )
            return (
              this.events.emit(
                new y(`request:end`, { requestId: i, request: a }),
              ),
              this.passthrough(),
              null
            );
          let ne = r?.quiet ? null : l.clone();
          return (
            await Ie(a, l),
            this.respondWith(l),
            this.events.emit(
              new y(`request:end`, { requestId: i, request: a }),
            ),
            r?.quiet || ee.log({ request: o, response: ne, parsedResult: te }),
            !0
          );
        }
      }));
  });
async function Ze(e, t) {
  let n = async (t) => {
      if (t === `bypass`) return;
      let n = await e.getUnhandledMessage();
      switch (t) {
        case `warn`:
          return f.warn(`Warning: %s`, n);
        case `error`:
          return f.error(`Error: %s`, n);
      }
    },
    i = async (e) => {
      if (
        (d.as(
          ce,
          e === `bypass` || e === `warn` || e === `error`,
          f.formatMessage(
            `Failed to react to an unhandled network frame: unknown strategy "%s". Please provide one of the supported strategies ("bypass", "warn", "error") or a custom callback function as the value of the "onUnhandledRequest" option.`,
            e,
          ),
        ),
        e !== `bypass` && (await n(e), e === `error`))
      )
        return Promise.reject(
          new ce(
            f.formatMessage(
              `Cannot bypass a request when using the "error" strategy for the "onUnhandledRequest" option.`,
            ),
          ),
        );
    };
  if (typeof t == `function`)
    return t({
      frame: e,
      defaults: { warn: n.bind(null, `warn`), error: n.bind(null, `error`) },
    });
  if (!(e instanceof Ye && r(e.data.request))) return i(t);
}
var Qe = e(() => {
  (u(), c(), p(), Xe());
});
function $e(e) {
  let t = [];
  for (let n of e) n instanceof Promise && t.push(n);
  if (t.length > 0) return Promise.all(t).then(() => {});
}
function et(e) {
  let t = 0,
    n = new be(),
    r = new Ae(),
    i = (e) => (e instanceof De ? e : new Oe(e || [])),
    a = { ...e },
    o = i(a.handlers);
  return {
    get readyState() {
      return t;
    },
    events: n,
    configure(e) {
      (d(
        t === 0,
        `Failed to call "configure()" on the network: cannot configure an already enabled network.`,
      ),
        e.handlers && !Object.is(e.handlers, a.handlers) && (o = i(e.handlers)),
        (a = { ...a, ...e }));
    },
    enable() {
      (d(t === 0, `Failed to call "enable" on the network: already enabled`),
        (t = 1));
      let e = { active: !0 };
      return (
        r.subscriptions.push(() => {
          e.active = !1;
        }),
        $e(
          a.sources.map(
            (t) => (
              Ve.prototype.disable.call(t),
              t.on(`frame`, async ({ frame: t }) => {
                t.events.on(`*`, (t) => {
                  e.active && n.emit(t);
                });
                let r = t.getHandlers(o);
                await t.resolve(r, a.onUnhandledFrame || `warn`, a.context);
              }),
              t.enable()
            ),
          ),
        )
      );
    },
    disable() {
      return (
        d(t === 1, `Failed to call "disable" on the network: already disabled`),
        (t = 0),
        r.dispose(),
        $e(a.sources.map((e) => e.disable()))
      );
    },
    use(...e) {
      o.use(e);
    },
    resetHandlers(...e) {
      o.reset(e);
    },
    restoreHandlers() {
      o.restore();
    },
    listHandlers() {
      return Me(o.currentHandlers());
    },
  };
}
var tt,
  nt = e(() => {
    (u(),
      v(),
      He(),
      ke(),
      Ne(),
      je(),
      (tt = ((e) => (
        (e[(e.DISABLED = 0)] = `DISABLED`),
        (e[(e.ENABLED = 1)] = `ENABLED`),
        e
      ))(tt || {})));
  });
async function rt(e, t, ...n) {
  let r = e.listeners(t);
  if (r.length !== 0) for (let t of r) await t.apply(e, n);
}
function it(e, t) {
  let n = e,
    r;
  for (; n;) {
    if (((r = Object.getOwnPropertyDescriptor(n, t)), r))
      return { owner: n, descriptor: r };
    n = Object.getPrototypeOf(n);
  }
}
function at(e) {
  let t = it(globalThis, e);
  if (t === void 0) return !1;
  let { descriptor: n } = t;
  return (typeof n.get == `function` && n.get() === void 0) ||
    (n.get === void 0 && n.value == null)
    ? !1
    : n.set === void 0 && !n.configurable
      ? (console.error(
          `[MSW] Failed to apply interceptor: the global \`${e}\` property is non-configurable. This is likely an issue with your environment. If you are using a framework, please open an issue about this in their repository.`,
        ),
        !1)
      : !0;
}
var ot,
  st,
  ct = e(() => {
    (u(),
      (ot = class {
        #e = new Map();
        applyPatch(e, t, n) {
          let r = this.#e.get(e);
          d(
            !r?.has(t),
            `Failed to replace a global value at "${String(t)}": already replaced.`,
          );
          let i = it(e, t);
          if (i === void 0)
            return (
              console.warn(
                `Failed to replace a global value at "${String(t)}": not a global value.`,
              ),
              () => {}
            );
          if (i.descriptor.configurable)
            Object.defineProperty(e, t, {
              value: n(e[t]),
              enumerable: !0,
              configurable: !0,
            });
          else if (i.descriptor.writable) e[t] = n(e[t]);
          else
            throw Error(
              `Failed to patch a non-configurable non-writable property "${t.toString()}"`,
            );
          let a = () => {
            let n = this.#e.get(e);
            n?.has(t) &&
              (i.owner === e
                ? Object.defineProperty(i.owner, t, i.descriptor)
                : Reflect.deleteProperty(e, t),
              n.delete(t),
              n.size === 0 && this.#e.delete(e));
          };
          return (r ? r.set(t, a) : this.#e.set(e, new Map([[t, a]])), a);
        }
        restoreAllPatches() {
          let e = [];
          for (let [, t] of this.#e)
            for (let [, n] of t)
              try {
                n();
              } catch (t) {
                if (t instanceof Error) e.push(t);
                else throw t;
              }
          if (e.length > 0) throw AggregateError(e, `FOO!`);
        }
      }),
      (st = new ot()));
  });
function b(e, t) {
  return (
    Object.defineProperties(t, {
      target: { value: e, enumerable: !0, writable: !0 },
      currentTarget: { value: e, enumerable: !0, writable: !0 },
    }),
    t
  );
}
function lt(e) {
  return typeof e == `string`
    ? e.length
    : e instanceof Blob
      ? e.size
      : e.byteLength;
}
var x,
  S,
  ut,
  dt,
  ft,
  C,
  pt,
  mt,
  ht,
  w,
  gt,
  T,
  _t,
  E,
  D,
  vt,
  yt,
  bt,
  xt = e(() => {
    (he(),
      ge(),
      ct(),
      ue(),
      u(),
      (x = Symbol(`kCancelable`)),
      (S = Symbol(`kDefaultPrevented`)),
      (ut = class extends MessageEvent {
        constructor(e, t) {
          (super(e, t), (this[x] = !!t.cancelable), (this[S] = !1));
        }
        get cancelable() {
          return this[x];
        }
        set cancelable(e) {
          this[x] = e;
        }
        get defaultPrevented() {
          return this[S];
        }
        set defaultPrevented(e) {
          this[S] = e;
        }
        preventDefault() {
          this.cancelable && !this[S] && (this[S] = !0);
        }
      }),
      (dt = class extends Event {
        constructor(e, t = {}) {
          (super(e, t),
            (this.code = t.code === void 0 ? 0 : t.code),
            (this.reason = t.reason === void 0 ? `` : t.reason),
            (this.wasClean = t.wasClean === void 0 ? !1 : t.wasClean));
        }
      }),
      (ft = class extends dt {
        constructor(e, t = {}) {
          (super(e, t), (this[x] = !!t.cancelable), (this[S] = !1));
        }
        get cancelable() {
          return this[x];
        }
        set cancelable(e) {
          this[x] = e;
        }
        get defaultPrevented() {
          return this[S];
        }
        set defaultPrevented(e) {
          this[S] = e;
        }
        preventDefault() {
          this.cancelable && !this[S] && (this[S] = !0);
        }
      }),
      (C = Symbol(`kEmitter`)),
      (pt = Symbol(`kBoundListener`)),
      (mt = class {
        constructor(e, t) {
          ((this.socket = e),
            (this.transport = t),
            (this.id = fe()),
            (this.url = new URL(e.url)),
            (this[C] = new EventTarget()),
            this.transport.addEventListener(`outgoing`, (e) => {
              let t = b(
                this.socket,
                new ut(`message`, {
                  data: e.data,
                  origin: e.origin,
                  cancelable: !0,
                }),
              );
              (this[C].dispatchEvent(t),
                t.defaultPrevented && e.preventDefault());
            }),
            this.transport.addEventListener(`close`, (e) => {
              this[C].dispatchEvent(b(this.socket, new dt(`close`, e)));
            }));
        }
        addEventListener(e, t, n) {
          if (!Reflect.has(t, pt)) {
            let e = t.bind(this.socket);
            Object.defineProperty(t, pt, {
              value: e,
              enumerable: !1,
              configurable: !1,
            });
          }
          this[C].addEventListener(e, Reflect.get(t, pt), n);
        }
        removeEventListener(e, t, n) {
          this[C].removeEventListener(e, Reflect.get(t, pt), n);
        }
        send(e) {
          this.transport.send(e);
        }
        close(e, t) {
          this.transport.close(e, t);
        }
      }),
      (ht = `InvalidAccessError: close code out of user configurable range`),
      (w = Symbol(`kPassthroughPromise`)),
      (gt = Symbol(`kOnSend`)),
      (T = Symbol(`kClose`)),
      (_t = class extends EventTarget {
        static {
          this.CONNECTING = 0;
        }
        static {
          this.OPEN = 1;
        }
        static {
          this.CLOSING = 2;
        }
        static {
          this.CLOSED = 3;
        }
        constructor(e, t) {
          (super(),
            (this.CONNECTING = 0),
            (this.OPEN = 1),
            (this.CLOSING = 2),
            (this.CLOSED = 3),
            (this._onopen = null),
            (this._onmessage = null),
            (this._onerror = null),
            (this._onclose = null),
            (this.url = de(e)),
            (this.protocol = ``),
            (this.extensions = ``),
            (this.binaryType = `blob`),
            (this.readyState = this.CONNECTING),
            (this.bufferedAmount = 0),
            (this[w] = new me()),
            queueMicrotask(async () => {
              (await this[w]) ||
                ((this.protocol =
                  typeof t == `string`
                    ? t
                    : Array.isArray(t) && t.length > 0
                      ? t[0]
                      : ``),
                this.readyState === this.CONNECTING &&
                  ((this.readyState = this.OPEN),
                  this.dispatchEvent(b(this, new Event(`open`)))));
            }));
        }
        set onopen(e) {
          (this.removeEventListener(`open`, this._onopen),
            (this._onopen = e),
            e !== null && this.addEventListener(`open`, e));
        }
        get onopen() {
          return this._onopen;
        }
        set onmessage(e) {
          (this.removeEventListener(`message`, this._onmessage),
            (this._onmessage = e),
            e !== null && this.addEventListener(`message`, e));
        }
        get onmessage() {
          return this._onmessage;
        }
        set onerror(e) {
          (this.removeEventListener(`error`, this._onerror),
            (this._onerror = e),
            e !== null && this.addEventListener(`error`, e));
        }
        get onerror() {
          return this._onerror;
        }
        set onclose(e) {
          (this.removeEventListener(`close`, this._onclose),
            (this._onclose = e),
            e !== null && this.addEventListener(`close`, e));
        }
        get onclose() {
          return this._onclose;
        }
        send(e) {
          if (this.readyState === this.CONNECTING)
            throw (this.close(), new DOMException(`InvalidStateError`));
          this.readyState === this.CLOSING ||
            this.readyState === this.CLOSED ||
            ((this.bufferedAmount += lt(e)),
            queueMicrotask(() => {
              ((this.bufferedAmount = 0), this[gt]?.(e));
            }));
        }
        close(e = 1e3, t) {
          (d(e, ht),
            d(e === 1e3 || (e >= 3e3 && e <= 4999), ht),
            this[T](e, t));
        }
        [T](e = 1e3, t, n = !0) {
          this.readyState === this.CLOSING ||
            this.readyState === this.CLOSED ||
            ((this.readyState = this.CLOSING),
            queueMicrotask(() => {
              ((this.readyState = this.CLOSED),
                this.dispatchEvent(
                  b(this, new dt(`close`, { code: e, reason: t, wasClean: n })),
                ),
                (this._onopen = null),
                (this._onmessage = null),
                (this._onerror = null),
                (this._onclose = null));
            }));
        }
        addEventListener(e, t, n) {
          return super.addEventListener(e, t, n);
        }
        removeEventListener(e, t, n) {
          return super.removeEventListener(e, t, n);
        }
      }),
      (E = Symbol(`kEmitter`)),
      (D = Symbol(`kBoundListener`)),
      (vt = Symbol(`kSend`)),
      (yt = class {
        constructor(e, t, n) {
          ((this.client = e),
            (this.transport = t),
            (this.createConnection = n),
            (this[E] = new EventTarget()),
            (this.mockCloseController = new AbortController()),
            (this.realCloseController = new AbortController()),
            this.transport.addEventListener(`outgoing`, (e) => {
              this.realWebSocket !== void 0 &&
                queueMicrotask(() => {
                  e.defaultPrevented || this[vt](e.data);
                });
            }),
            this.transport.addEventListener(
              `incoming`,
              this.handleIncomingMessage.bind(this),
            ));
        }
        get socket() {
          return (
            d(
              this.realWebSocket,
              'Cannot access "socket" on the original WebSocket server object: the connection is not open. Did you forget to call `server.connect()`?',
            ),
            this.realWebSocket
          );
        }
        connect() {
          d(
            !this.realWebSocket ||
              this.realWebSocket.readyState !== WebSocket.OPEN,
            `Failed to call "connect()" on the original WebSocket instance: the connection already open`,
          );
          let e = this.createConnection();
          ((e.binaryType = this.client.binaryType),
            e.addEventListener(
              `open`,
              (e) => {
                this[E].dispatchEvent(
                  b(this.realWebSocket, new Event(`open`, e)),
                );
              },
              { once: !0 },
            ),
            e.addEventListener(`message`, (e) => {
              this.transport.dispatchEvent(
                b(
                  this.realWebSocket,
                  new MessageEvent(`incoming`, {
                    data: e.data,
                    origin: e.origin,
                  }),
                ),
              );
            }),
            this.client.addEventListener(
              `close`,
              (e) => {
                this.handleMockClose(e);
              },
              { signal: this.mockCloseController.signal },
            ),
            e.addEventListener(
              `close`,
              (e) => {
                this.handleRealClose(e);
              },
              { signal: this.realCloseController.signal },
            ),
            e.addEventListener(`error`, () => {
              let t = b(e, new Event(`error`, { cancelable: !0 }));
              (this[E].dispatchEvent(t),
                t.defaultPrevented ||
                  this.client.dispatchEvent(
                    b(this.client, new Event(`error`)),
                  ));
            }),
            (this.realWebSocket = e));
        }
        addEventListener(e, t, n) {
          if (!Reflect.has(t, D)) {
            let e = t.bind(this.client);
            Object.defineProperty(t, D, { value: e, enumerable: !1 });
          }
          this[E].addEventListener(e, Reflect.get(t, D), n);
        }
        removeEventListener(e, t, n) {
          this[E].removeEventListener(e, Reflect.get(t, D), n);
        }
        send(e) {
          this[vt](e);
        }
        [vt](e) {
          let { realWebSocket: t } = this;
          if (
            (d(
              t,
              `Failed to call "server.send()" for "%s": the connection is not open. Did you forget to call "server.connect()"?`,
              this.client.url,
            ),
            !(
              t.readyState === WebSocket.CLOSING ||
              t.readyState === WebSocket.CLOSED
            ))
          ) {
            if (t.readyState === WebSocket.CONNECTING) {
              t.addEventListener(
                `open`,
                () => {
                  t.send(e);
                },
                { once: !0 },
              );
              return;
            }
            t.send(e);
          }
        }
        close() {
          let { realWebSocket: e } = this;
          (d(
            e,
            `Failed to close server connection for "%s": the connection is not open. Did you forget to call "server.connect()"?`,
            this.client.url,
          ),
            this.realCloseController.abort(),
            !(
              e.readyState === WebSocket.CLOSING ||
              e.readyState === WebSocket.CLOSED
            ) &&
              (e.close(),
              queueMicrotask(() => {
                this[E].dispatchEvent(
                  b(
                    this.realWebSocket,
                    new ft(`close`, { code: 1e3, cancelable: !0 }),
                  ),
                );
              })));
        }
        handleIncomingMessage(e) {
          let t = b(
            e.target,
            new ut(`message`, {
              data: e.data,
              origin: e.origin,
              cancelable: !0,
            }),
          );
          (this[E].dispatchEvent(t),
            t.defaultPrevented ||
              this.client.dispatchEvent(
                b(
                  this.client,
                  new MessageEvent(`message`, {
                    data: e.data,
                    origin: e.origin,
                  }),
                ),
              ));
        }
        handleMockClose(e) {
          this.realWebSocket && this.realWebSocket.close();
        }
        handleRealClose(e) {
          this.mockCloseController.abort();
          let t = b(
            this.realWebSocket,
            new ft(`close`, {
              code: e.code,
              reason: e.reason,
              wasClean: e.wasClean,
              cancelable: !0,
            }),
          );
          (this[E].dispatchEvent(t),
            t.defaultPrevented || this.client[T](e.code, e.reason));
        }
      }),
      (bt = class extends EventTarget {
        constructor(e) {
          (super(),
            (this.socket = e),
            this.socket.addEventListener(`close`, (e) => {
              this.dispatchEvent(b(this.socket, new dt(`close`, e)));
            }),
            (this.socket[gt] = (e) => {
              this.dispatchEvent(
                b(
                  this.socket,
                  new ut(`outgoing`, {
                    data: e,
                    origin: this.socket.url,
                    cancelable: !0,
                  }),
                ),
              );
            }));
        }
        addEventListener(e, t, n) {
          return super.addEventListener(e, t, n);
        }
        dispatchEvent(e) {
          return super.dispatchEvent(e);
        }
        send(e) {
          queueMicrotask(() => {
            if (
              this.socket.readyState === this.socket.CLOSING ||
              this.socket.readyState === this.socket.CLOSED
            )
              return;
            let t = () => {
              this.socket.dispatchEvent(
                b(
                  this.socket,
                  new MessageEvent(`message`, {
                    data: e,
                    origin: this.socket.url,
                  }),
                ),
              );
            };
            this.socket.readyState === this.socket.CONNECTING
              ? this.socket.addEventListener(
                  `open`,
                  () => {
                    t();
                  },
                  { once: !0 },
                )
              : t();
          });
        }
        close(e, t) {
          this.socket[T](e, t);
        }
      }),
      class e extends se {
        static {
          this.symbol = Symbol.for(`websocket-interceptor`);
        }
        constructor() {
          super(e.symbol);
        }
        checkEnvironment() {
          return at(`WebSocket`);
        }
        setup() {
          let e = this.logger.extend(`setup`),
            t = new Proxy(globalThis.WebSocket, {
              construct: (e, t, n) => {
                let [r, i] = t,
                  a = () => Reflect.construct(e, t, n),
                  o = new _t(r, i),
                  s = new bt(o);
                return (
                  queueMicrotask(async () => {
                    try {
                      let e = new yt(o, s, a),
                        t = this.emitter.listenerCount(`connection`) > 0;
                      (await rt(this.emitter, `connection`, {
                        client: new mt(o, s),
                        server: e,
                        info: { protocols: i },
                      }),
                        t
                          ? o[w].resolve(!1)
                          : (o[w].resolve(!0),
                            e.connect(),
                            e.addEventListener(`open`, () => {
                              (o.dispatchEvent(b(o, new Event(`open`))),
                                e.realWebSocket &&
                                  (o.protocol = e.realWebSocket.protocol));
                            })));
                    } catch (e) {
                      e instanceof Error &&
                        (o.dispatchEvent(new Event(`error`)),
                        o.readyState !== WebSocket.CLOSING &&
                          o.readyState !== WebSocket.CLOSED &&
                          o[T](1011, e.message, !1),
                        console.error(e));
                    }
                  }),
                  o
                );
              },
            });
          (e.info(`patching global WebSocket...`),
            this.subscriptions.push(
              st.applyPatch(globalThis, `WebSocket`, () => t),
            ),
            e.info(`global WebSocket patched!`, globalThis.WebSocket.name));
        }
      });
  }),
  St,
  Ct,
  wt,
  Tt = e(() => {
    (v(),
      xt(),
      a(),
      ze(),
      Qe(),
      p(),
      (St = class extends _ {
        url;
        protocols;
        constructor(e, t) {
          (super(e, {}), (this.url = t.url), (this.protocols = t.protocols));
        }
      }),
      (Ct = class extends _ {
        url;
        protocols;
        error;
        constructor(e, t) {
          (super(e, {}),
            (this.url = t.url),
            (this.protocols = t.protocols),
            (this.error = t.error));
        }
      }),
      (wt = class extends Re {
        constructor(e) {
          super(`ws`, { connection: e.connection });
        }
        getHandlers(e) {
          return e.getHandlersByKind(`websocket`);
        }
        async resolve(e, t, n) {
          let { connection: r } = this.data;
          if (
            (this.events.emit(
              new St(`connection`, {
                url: r.client.url,
                protocols: r.info.protocols,
              }),
            ),
            e.length === 0)
          )
            return (
              await Ze(this, t).then(
                () => this.passthrough(),
                (e) => this.errorWith(e),
              ),
              !1
            );
          let i = !1;
          for (let t of e) {
            let e = await t.run(r, {
              baseUrl: n?.baseUrl?.toString(),
              [te]: !1,
            });
            if (!e) continue;
            i = !0;
            let a = n?.quiet ? void 0 : t.log(r);
            try {
              t[re](e) || a?.();
            } catch (e) {
              throw (
                this.events.emit(
                  new Ct(`unhandledException`, {
                    error: e,
                    url: r.client.url,
                    protocols: r.info.protocols,
                  }),
                ) ||
                  (console.error(e),
                  f.error(
                    `Encountered an unhandled exception during the handler lookup for "%s". Please see the original error above.`,
                    r.client.url,
                  )),
                e
              );
            }
          }
          return i
            ? !0
            : (await Ze(this, t).then(
                () => this.passthrough(),
                (e) => this.errorWith(e),
              ),
              !1);
        }
        async getUnhandledMessage() {
          let { connection: e } = this.data;
          return `intercepted a WebSocket connection without a matching event handler:${`

  \u2022 ${e.client.url}

`}If you still wish to intercept this unhandled connection, please create an event handler for it.
Read more: https://mswjs.io/docs/websocket`;
        }
      }));
  }),
  Et,
  Dt,
  Ot,
  kt = e(() => {
    (le(),
      He(),
      p(),
      Xe(),
      Tt(),
      Ke(),
      (Et = class extends Ve {
        #e;
        #t;
        constructor(e) {
          (super(),
            (this.#e = new t({
              name: `interceptor-source`,
              interceptors: e.interceptors,
            })),
            (this.#t = new Map()));
        }
        enable() {
          (this.#e.apply(),
            this.#e
              .on(`request`, this.#n.bind(this))
              .on(`response`, this.#r.bind(this))
              .on(`connection`, this.#i.bind(this)));
        }
        disable() {
          (super.disable(), this.#e.dispose(), this.#t.clear());
        }
        async #n({ requestId: e, request: t, controller: n }) {
          let r = new Dt({ id: e, request: t, controller: n });
          (this.#t.set(e, r), await this.queue(r));
        }
        async #r({
          requestId: e,
          request: t,
          response: n,
          isMockedResponse: r,
        }) {
          let i = this.#t.get(e);
          (this.#t.delete(e),
            i != null &&
              queueMicrotask(() => {
                try {
                  i.events.emit(
                    new qe(r ? `response:mocked` : `response:bypass`, {
                      requestId: e,
                      request: t,
                      response: n,
                    }),
                  );
                } finally {
                  i.events.removeAllListeners();
                }
              }));
        }
        async #i(e) {
          await this.queue(new Ot({ connection: e }));
        }
      }),
      (Dt = class extends Ye {
        #e;
        constructor(e) {
          (super({ id: e.id, request: e.request }), (this.#e = e.controller));
        }
        passthrough() {
          Ge(this.data.request);
        }
        respondWith(e) {
          e && this.#e.respondWith(e);
        }
        errorWith(e) {
          if (e instanceof Response) return this.respondWith(e);
          throw (e instanceof ce && this.#e.errorWith(e), e);
        }
      }),
      (Ot = class extends wt {
        constructor(e) {
          (super({ connection: e.connection }),
            e.connection.client.addEventListener(
              `close`,
              () => {
                this.events.removeAllListeners();
              },
              { once: !0 },
            ));
        }
        errorWith(e) {
          if (e instanceof Error) {
            let { client: t } = this.data.connection,
              n = new Event(`error`);
            (Object.defineProperty(n, "cause", {
              enumerable: !0,
              configurable: !1,
              value: e,
            }),
              t.socket.dispatchEvent(n));
          }
        }
        passthrough() {
          this.data.connection.server.connect();
        }
      }));
  });
function At(e) {
  return ({ frame: t, defaults: n }) => {
    let r = e();
    if (r != null) {
      if (typeof r == `function`) {
        let e =
          t instanceof Ye
            ? t.data.request
            : t instanceof wt
              ? new Request(t.data.connection.client.url, {
                  headers: { connection: `upgrade`, upgrade: `websocket` },
                })
              : null;
        return (
          d(
            e != null,
            'Failed to coerce a network frame to a legacy `onUnhandledRequest` strategy: unknown frame protocol "%s"',
            t.protocol,
          ),
          r(e, { warning: n.warn, error: n.error })
        );
      }
      return Ze(t, r);
    }
  };
}
var jt = e(() => {
  (u(), Qe(), Xe(), Tt());
});
function Mt(e) {
  return {
    status: e.status,
    statusText: e.statusText,
    headers: Object.fromEntries(e.headers.entries()),
  };
}
var Nt = e(() => {});
function Pt(e, t) {
  switch (t) {
    case `s`:
      return e;
    case `d`:
    case `i`:
      return Number(e);
    case `j`:
      return JSON.stringify(e);
    case `o`: {
      if (typeof e == `string`) return e;
      let t = JSON.stringify(e);
      return t === `{}` || t === `[]` || /^\[object .+?\]$/.test(t) ? e : t;
    }
  }
}
function O(e, ...t) {
  if (t.length === 0) return e;
  let n = 0,
    r = e.replace(Wn, (e, r, i, a) => {
      let o = t[n],
        s = Pt(o, a);
      return r ? e : (n++, s);
    });
  return (
    n < t.length && (r += ` ${t.slice(n).join(` `)}`),
    (r = r.replace(/%{2,2}/g, `%`)),
    r
  );
}
function Ft(e) {
  if (!e.stack) return;
  let t = e.stack.split(`
`);
  (t.splice(1, Gn),
    (e.stack = t.join(`
`)));
}
function It() {
  if (typeof navigator < `u` && navigator.product === `ReactNative`) return !0;
  if (typeof process < `u`) {
    let e = process.type;
    return e === `renderer` || e === `worker`
      ? !1
      : !!(process.versions && process.versions.node);
  }
  return !1;
}
function Lt(e) {
  return `\x1B[33m${e}\x1B[0m`;
}
function Rt(e) {
  return `\x1B[34m${e}\x1B[0m`;
}
function zt(e) {
  return `\x1B[90m${e}\x1B[0m`;
}
function Bt(e) {
  return `\x1B[31m${e}\x1B[0m`;
}
function Vt(e) {
  return `\x1B[32m${e}\x1B[0m`;
}
function Ht(e, ...t) {
  if (F) {
    process.stdout.write(
      O(e, ...t) +
        `
`,
    );
    return;
  }
  console.log(e, ...t);
}
function Ut(e, ...t) {
  if (F) {
    process.stderr.write(
      O(e, ...t) +
        `
`,
    );
    return;
  }
  console.warn(e, ...t);
}
function Wt(e, ...t) {
  if (F) {
    process.stderr.write(
      O(e, ...t) +
        `
`,
    );
    return;
  }
  console.error(e, ...t);
}
function Gt(e) {
  return F ? {}[e] : globalThis[e]?.toString();
}
function k(e, t) {
  return e !== void 0 && e !== t;
}
function Kt(e) {
  return e === void 0
    ? `undefined`
    : e === null
      ? `null`
      : typeof e == `string`
        ? e
        : typeof e == `object`
          ? JSON.stringify(e)
          : e.toString();
}
function qt(e) {
  return globalThis[e] || void 0;
}
function Jt(e, t) {
  globalThis[e] = t;
}
function Yt(e) {
  delete globalThis[e];
}
function Xt() {
  return Math.random().toString(16).slice(2);
}
function Zt(e) {
  if (typeof e == `string`)
    return Zt(new URL(e, typeof location < `u` ? location.href : void 0));
  if (
    (e.protocol === `http:`
      ? (e.protocol = `ws:`)
      : e.protocol === `https:` && (e.protocol = `wss:`),
    e.protocol !== `ws:` && e.protocol !== `wss:`)
  )
    throw SyntaxError(
      `Failed to construct 'WebSocket': The URL's scheme must be either 'http', 'https', 'ws', or 'wss'. '${e.protocol}' is not allowed.`,
    );
  if (e.hash !== ``)
    throw SyntaxError(
      `Failed to construct 'WebSocket': The URL contains a fragment identifier ('${e.hash}'). Fragment identifiers are not allowed in WebSocket URLs.`,
    );
  return e.href;
}
async function A(e, t, ...n) {
  let r = e.listeners(t);
  if (r.length !== 0) for (let t of r) await t.apply(e, n);
}
function Qt(e, t) {
  let n = e,
    r;
  for (; n;) {
    if (((r = Object.getOwnPropertyDescriptor(n, t)), r))
      return { owner: n, descriptor: r };
    n = Object.getPrototypeOf(n);
  }
}
function $t(e) {
  let t = Qt(globalThis, e);
  if (t === void 0) return !1;
  let { descriptor: n } = t;
  return (typeof n.get == `function` && n.get() === void 0) ||
    (n.get === void 0 && n.value == null)
    ? !1
    : n.set === void 0 && !n.configurable
      ? (console.error(
          `[MSW] Failed to apply interceptor: the global \`${e}\` property is non-configurable. This is likely an issue with your environment. If you are using a framework, please open an issue about this in their repository.`,
        ),
        !1)
      : !0;
}
function en() {
  let e = (t, n) => {
    ((e.state = `pending`),
      (e.resolve = (n) =>
        e.state === `pending`
          ? ((e.result = n),
            t(
              n instanceof Promise
                ? n
                : Promise.resolve(n).then((t) => ((e.state = `fulfilled`), t)),
            ))
          : void 0),
      (e.reject = (t) => {
        if (e.state === `pending`)
          return (
            queueMicrotask(() => {
              e.state = `rejected`;
            }),
            n((e.rejectionReason = t))
          );
      }));
  };
  return e;
}
function j(e, t) {
  return (
    Object.defineProperties(t, {
      target: { value: e, enumerable: !0, writable: !0 },
      currentTarget: { value: e, enumerable: !0, writable: !0 },
    }),
    t
  );
}
function tn(e) {
  return typeof e == `string`
    ? e.length
    : e instanceof Blob
      ? e.size
      : e.byteLength;
}
function nn() {
  return (
    typeof navigator < `u` &&
    `serviceWorker` in navigator &&
    typeof location < `u` &&
    location.protocol !== `file:`
  );
}
function rn() {
  try {
    let e = new ReadableStream({ start: (e) => e.close() });
    return (new MessageChannel().port1.postMessage(e, [e]), !0);
  } catch {
    return !1;
  }
}
function an() {
  let e = (t, n) => {
    ((e.state = `pending`),
      (e.resolve = (n) =>
        e.state === `pending`
          ? ((e.result = n),
            t(
              n instanceof Promise
                ? n
                : Promise.resolve(n).then((t) => ((e.state = `fulfilled`), t)),
            ))
          : void 0),
      (e.reject = (t) => {
        if (e.state === `pending`)
          return (
            queueMicrotask(() => {
              e.state = `rejected`;
            }),
            n((e.rejectionReason = t))
          );
      }));
  };
  return e;
}
function on(e) {
  try {
    return (new URL(e), !0);
  } catch {
    return !1;
  }
}
function sn(e, t) {
  let n = Object.getOwnPropertySymbols(t).find((t) => t.description === e);
  if (n) return Reflect.get(t, n);
}
function cn(e, t) {
  Reflect.set(e, yr, t);
}
function ln(e) {
  return br.encode(e);
}
function un(e, t) {
  return new TextDecoder(t).decode(e);
}
function dn(e) {
  return e.buffer.slice(e.byteOffset, e.byteOffset + e.byteLength);
}
async function fn(e) {
  try {
    return [
      null,
      await e().catch((e) => {
        throw e;
      }),
    ];
  } catch (e) {
    return [e, null];
  }
}
function pn(e) {
  return new URL(e, location.href).href;
}
function mn(e, t, n) {
  return (
    [e.active, e.installing, e.waiting]
      .filter((e) => e != null)
      .find((e) => n(e.scriptURL, t)) || null
  );
}
function hn(e) {
  if (![`HEAD`, `GET`].includes(e.method)) return e.body;
}
function gn(e) {
  return new Request(e.url, { ...e, body: hn(e) });
}
function _n(e) {
  location.href.startsWith(e.scope) ||
    f.warn(`Cannot intercept requests on this page because it's outside of the worker's scope ("${e.scope}"). If you wish to mock API requests on this page, you must resolve this scope issue.

- (Recommended) Register the worker at the root level ("/") of your application.
- Set the "Service-Worker-Allowed" response header to allow out-of-scope workers.`);
}
function vn(e, t) {
  return (
    e.findWorker !== t.findWorker ||
    e.serviceWorker.url !== t.serviceWorker.url ||
    JSON.stringify(e.serviceWorker.options) !==
      JSON.stringify(t.serviceWorker.options)
  );
}
function yn(e, t = !1) {
  return t
    ? Object.prototype.toString.call(e).startsWith(`[object `)
    : Object.prototype.toString.call(e) === `[object Object]`;
}
function bn(e, t) {
  try {
    return (e[t], !0);
  } catch {
    return !1;
  }
}
function xn(e) {
  return new Response(
    JSON.stringify(
      e instanceof Error
        ? { name: e.name, message: e.message, stack: e.stack }
        : e,
    ),
    {
      status: 500,
      statusText: `Unhandled Exception`,
      headers: { "Content-Type": `application/json` },
    },
  );
}
function Sn(e) {
  return (
    e != null && e instanceof Response && bn(e, `type`) && e.type === `error`
  );
}
function Cn(e) {
  return (
    yn(e, !0) && bn(e, `status`) && bn(e, `statusText`) && bn(e, `bodyUsed`)
  );
}
function wn(e) {
  return e == null || !(e instanceof Error) ? !1 : `code` in e && `errno` in e;
}
async function Tn(e) {
  let t = async (t) =>
      t instanceof Error
        ? (await e.controller.errorWith(t), !0)
        : Sn(t) || Cn(t)
          ? (await e.controller.respondWith(t), !0)
          : yn(t)
            ? (await e.controller.errorWith(t), !0)
            : !1,
    n = async (n) => {
      if (n instanceof hr) throw a.error;
      return wn(n)
        ? (await e.controller.errorWith(n), !0)
        : n instanceof Response
          ? await t(n)
          : !1;
    },
    r = new R(),
    i = () => {
      r.reject(e.request.signal?.reason);
    };
  if (e.request.signal) {
    if (e.request.signal.aborted) {
      await e.controller.errorWith(e.request.signal.reason);
      return;
    }
    e.request.signal.addEventListener(`abort`, i, { once: !0 });
  }
  let a = await jr(async () => {
    let t = A(e.emitter, `request`, {
      requestId: e.requestId,
      request: e.request,
      controller: e.controller,
    });
    await Promise.race([r, t, e.controller.handled]);
  });
  if (
    (e.request.signal?.removeEventListener(`abort`, i), r.state === `rejected`)
  ) {
    await e.controller.errorWith(r.rejectionReason);
    return;
  }
  if (a.error) {
    if (await n(a.error)) return;
    if (e.emitter.listenerCount(`unhandledException`) > 0) {
      let n = new Y(e.request, {
        passthrough() {},
        async respondWith(e) {
          await t(e);
        },
        async errorWith(t) {
          await e.controller.errorWith(t);
        },
      });
      if (
        (await A(e.emitter, `unhandledException`, {
          error: a.error,
          request: e.request,
          requestId: e.requestId,
          controller: n,
        }),
        n.readyState !== Y.PENDING)
      )
        return;
    }
    await e.controller.respondWith(xn(a.error));
    return;
  }
  return e.controller.readyState === Y.PENDING
    ? await e.controller.passthrough()
    : e.controller.handled;
}
function M(e) {
  return Object.assign(TypeError(`Failed to fetch`), { cause: e });
}
async function En(e, t) {
  if (t.status !== 303 && e.body != null) return Promise.reject(M());
  let n = new URL(e.url),
    r;
  try {
    r = new URL(t.headers.get(`location`), e.url);
  } catch (e) {
    return Promise.reject(M(e));
  }
  if (!(r.protocol === `http:` || r.protocol === `https:`))
    return Promise.reject(M(`URL scheme must be a HTTP(S) scheme`));
  if (Reflect.get(e, Nr) > 20)
    return Promise.reject(M(`redirect count exceeded`));
  if (
    (Object.defineProperty(e, Nr, { value: (Reflect.get(e, Nr) || 0) + 1 }),
    e.mode === `cors` && (r.username || r.password) && !Dn(n, r))
  )
    return Promise.reject(
      M(`cross origin not allowed for request mode "cors"`),
    );
  let i = {};
  ((([301, 302].includes(t.status) && e.method === `POST`) ||
    (t.status === 303 && ![`HEAD`, `GET`].includes(e.method))) &&
    ((i.method = `GET`),
    (i.body = null),
    Mr.forEach((t) => {
      e.headers.delete(t);
    })),
    Dn(n, r) ||
      (e.headers.delete(`authorization`),
      e.headers.delete(`proxy-authorization`),
      e.headers.delete(`cookie`),
      e.headers.delete(`host`)),
    (i.headers = e.headers));
  let a = await fetch(new Request(r, i));
  return (
    Object.defineProperty(a, "redirected", { value: !0, configurable: !0 }), a
  );
}
function Dn(e, t) {
  return (
    (e.origin === t.origin && e.origin === `null`) ||
    (e.protocol === t.protocol &&
      e.hostname === t.hostname &&
      e.port === t.port)
  );
}
function On(e) {
  return e
    .toLowerCase()
    .split(`,`)
    .map((e) => e.trim());
}
function kn(e) {
  if (e === ``) return null;
  let t = On(e);
  return t.length === 0
    ? null
    : new Fr(
        t.reduceRight(
          (e, t) =>
            t === `gzip` || t === `x-gzip`
              ? e.concat(new DecompressionStream(`gzip`))
              : t === `deflate`
                ? e.concat(new DecompressionStream(`deflate`))
                : t === `br`
                  ? e.concat(new Pr())
                  : ((e.length = 0), e),
          [],
        ),
      );
}
function An(e) {
  if (e.body === null) return null;
  let t = kn(e.headers.get(`content-encoding`) || ``);
  return t ? (e.body.pipeTo(t.writable), t.readable) : null;
}
function jn(e, t) {
  let n = new Uint8Array(e.byteLength + t.byteLength);
  return (n.set(e, 0), n.set(t, e.byteLength), n);
}
function Mn(e, t, n) {
  let r = [
      `error`,
      `progress`,
      `loadstart`,
      `loadend`,
      `load`,
      `timeout`,
      `abort`,
    ],
    i = zr ? ProgressEvent : Rr;
  return r.includes(t)
    ? new i(t, {
        lengthComputable: !0,
        loaded: n?.loaded || 0,
        total: n?.total || 0,
      })
    : new Lr(t, { target: e, currentTarget: e });
}
function Nn(e, t) {
  if (!(t in e)) return null;
  if (Object.prototype.hasOwnProperty.call(e, t)) return e;
  let n = Reflect.getPrototypeOf(e);
  return n ? Nn(n, t) : null;
}
function Pn(e, t) {
  return new Proxy(e, Fn(t));
}
function Fn(e) {
  let { constructorCall: t, methodCall: n, getProperty: r, setProperty: i } = e,
    a = {};
  return (
    t !== void 0 &&
      (a.construct = function (e, n, r) {
        let i = Reflect.construct.bind(null, e, n, r);
        return t.call(r, n, i);
      }),
    (a.set = function (e, t, n) {
      let r = () => {
        let r = Nn(e, t) || e,
          i = Reflect.getOwnPropertyDescriptor(r, t);
        return i?.set === void 0
          ? Reflect.defineProperty(r, t, {
              writable: !0,
              enumerable: !0,
              configurable: !0,
              value: n,
            })
          : (i.set.apply(e, [n]), !0);
      };
      return i === void 0 ? r() : i.call(e, [t, n], r);
    }),
    (a.get = function (e, t, i) {
      let a = () => e[t],
        o = r === void 0 ? a() : r.call(e, [t, i], a);
      return typeof o == `function`
        ? (...r) => {
            let i = o.bind(e, ...r);
            return n === void 0 ? i() : n.call(e, [t, r], i);
          }
        : o;
    }),
    a
  );
}
function In(e) {
  return [
    `application/xhtml+xml`,
    `application/xml`,
    `image/svg+xml`,
    `text/html`,
    `text/xml`,
  ].some((t) => e.startsWith(t));
}
function Ln(e) {
  try {
    return JSON.parse(e);
  } catch {
    return null;
  }
}
function Rn(e, t) {
  return new X(X.isResponseWithBody(e.status) ? t : null, {
    url: e.responseURL,
    status: e.status,
    statusText: e.statusText,
    headers: zn(e.getAllResponseHeaders()),
  });
}
function zn(e) {
  let t = new Headers(),
    n = e.split(/[\r\n]+/);
  for (let e of n) {
    if (e.trim() === ``) continue;
    let [n, ...r] = e.split(`: `),
      i = r.join(`: `);
    t.append(n, i);
  }
  return t;
}
async function Bn(e) {
  let t = e.headers.get(`content-length`);
  return t != null && t !== `` ? Number(t) : (await e.arrayBuffer()).byteLength;
}
function Vn(e) {
  return typeof location > `u`
    ? new URL(e)
    : new URL(e.toString(), location.href);
}
function N(e, t, n) {
  Reflect.defineProperty(e, t, { writable: !0, enumerable: !0, value: n });
}
function Hn({ emitter: e, logger: t }) {
  return new Proxy(globalThis.XMLHttpRequest, {
    construct(n, r, i) {
      t.info(`constructed new XMLHttpRequest`);
      let a = Reflect.construct(n, r, i),
        o = Object.getOwnPropertyDescriptors(n.prototype);
      for (let e in o) Reflect.defineProperty(a, e, o[e]);
      let s = new Hr(a, t);
      return (
        (s.onRequest = async function ({ request: t, requestId: n }) {
          let r = new Y(t, {
            passthrough: () => {
              this.logger.info(
                `no mocked response received, performing request as-is...`,
              );
            },
            respondWith: async (e) => {
              if (Sn(e)) {
                this.errorWith(TypeError(`Network error`));
                return;
              }
              await this.respondWith(e);
            },
            errorWith: (e) => {
              (this.logger.info(`request errored!`, { error: e }),
                e instanceof Error && this.errorWith(e));
            },
          });
          (this.logger.info(`awaiting mocked response...`),
            this.logger.info(
              `emitting the "request" event for %s listener(s)...`,
              e.listenerCount(`request`),
            ),
            await Tn({ request: t, requestId: n, controller: r, emitter: e }));
        }),
        (s.onResponse = async function ({
          response: t,
          isMockedResponse: n,
          request: r,
          requestId: i,
        }) {
          (this.logger.info(
            `emitting the "response" event for %s listener(s)...`,
            e.listenerCount(`response`),
          ),
            e.emit(`response`, {
              response: t,
              isMockedResponse: n,
              request: r,
              requestId: i,
            }));
        }),
        s.request
      );
    },
  });
}
function Un(...e) {
  P(
    !It(),
    f.formatMessage(
      "Failed to execute `setupWorker` in a non-browser environment",
    ),
  );
  let t = et({ sources: [], handlers: e });
  return {
    async start(e) {
      if (
        (e?.waitUntilReady != null &&
          f.warn(
            `The "waitUntilReady" option has been deprecated. Please remove it from this "worker.start()" call. Follow the recommended Browser integration (https://mswjs.io/docs/integrations/browser) to eliminate any race conditions between the Service Worker registration and any requests made by your application on initial render.`,
          ),
        t.readyState === tt.ENABLED)
      ) {
        f.warn(
          `Found a redundant "worker.start()" call. Note that starting the worker while mocking is already enabled will have no effect. Consider removing this "worker.start()" call.`,
        );
        return;
      }
      let n = nn()
        ? await kr.from({
            serviceWorker: {
              url: e?.serviceWorker?.url?.toString() || Gr,
              options: e?.serviceWorker?.options,
            },
            findWorker: e?.findWorker,
            quiet: e?.quiet,
          })
        : new Wr({ quiet: e?.quiet });
      if (
        (t.configure({
          sources: [n, new Et({ interceptors: [new mr()] })],
          onUnhandledFrame: At(() => e?.onUnhandledRequest || `warn`),
          context: { quiet: e?.quiet },
        }),
        await t.enable(),
        n instanceof kr)
      ) {
        let [, e] = await n.workerPromise;
        return e;
      }
    },
    stop() {
      if (t.readyState === tt.DISABLED) {
        f.warn(
          `Found a redundant "worker.stop()" call. Notice that stopping the worker after it has already been stopped has no effect. Consider removing this "worker.stop()" call.`,
        );
        return;
      }
      (t.disable(), window.postMessage({ type: `msw/worker:stop` }));
    },
    events: t.events,
    use: t.use.bind(t),
    resetHandlers: t.resetHandlers.bind(t),
    restoreHandlers: t.restoreHandlers.bind(t),
    listHandlers: t.listHandlers.bind(t),
  };
}
var Wn,
  Gn,
  Kn,
  P,
  qn,
  Jn,
  Yn,
  F,
  Xn,
  Zn,
  I,
  Qn,
  $n,
  er,
  tr,
  L,
  nr,
  rr,
  ir,
  R,
  z,
  B,
  ar,
  V,
  or,
  H,
  U,
  sr,
  cr,
  W,
  lr,
  G,
  ur,
  K,
  q,
  dr,
  fr,
  pr,
  mr,
  J,
  hr,
  Y,
  gr,
  _r,
  vr,
  X,
  yr,
  br,
  xr,
  Sr,
  Cr,
  Z,
  Q,
  wr,
  Tr,
  Er,
  Dr,
  Or,
  kr,
  Ar,
  jr,
  Mr,
  Nr,
  Pr,
  Fr,
  Ir,
  Lr,
  Rr,
  zr,
  $,
  Br,
  Vr,
  Hr,
  Ur,
  Wr,
  Gr;
e(() => {
  (nt(),
    kt(),
    jt(),
    p(),
    He(),
    o(),
    Xe(),
    ie(),
    Nt(),
    Se(),
    (Wn = /(%?)(%([sdijo]))/g),
    (Gn = 2),
    (Kn = class extends Error {
      constructor(e, ...t) {
        (super(e),
          (this.message = e),
          (this.name = `Invariant Violation`),
          (this.message = O(e, ...t)),
          Ft(this));
      }
    }),
    (P = (e, t, ...n) => {
      if (!e) throw new Kn(t, ...n);
    }),
    (P.as = (e, t, n, ...r) => {
      if (!t) {
        let t = r.length === 0 ? n : O(n, ...r),
          i;
        try {
          i = Reflect.construct(e, [t]);
        } catch {
          i = e(t);
        }
        throw i;
      }
    }),
    (qn = Object.defineProperty),
    (Jn = (e, t) => {
      for (var n in t) qn(e, n, { get: t[n], enumerable: !0 });
    }),
    (Yn = {}),
    Jn(Yn, {
      blue: () => Rt,
      gray: () => zt,
      green: () => Vt,
      red: () => Bt,
      yellow: () => Lt,
    }),
    (F = It()),
    (Xn = class {
      constructor(e) {
        ((this.name = e), (this.prefix = `[${this.name}]`));
        let t = Gt(`DEBUG`),
          n = Gt(`LOG_LEVEL`);
        t === `1` || t === `true` || (t !== void 0 && this.name.startsWith(t))
          ? ((this.debug = k(n, `debug`) ? I : this.debug),
            (this.info = k(n, `info`) ? I : this.info),
            (this.success = k(n, `success`) ? I : this.success),
            (this.warning = k(n, `warning`) ? I : this.warning),
            (this.error = k(n, `error`) ? I : this.error))
          : ((this.info = I),
            (this.success = I),
            (this.warning = I),
            (this.error = I),
            (this.only = I));
      }
      prefix;
      extend(e) {
        return new Xn(`${this.name}:${e}`);
      }
      debug(e, ...t) {
        this.logEntry({
          level: `debug`,
          message: zt(e),
          positionals: t,
          prefix: this.prefix,
          colors: { prefix: `gray` },
        });
      }
      info(e, ...t) {
        this.logEntry({
          level: `info`,
          message: e,
          positionals: t,
          prefix: this.prefix,
          colors: { prefix: `blue` },
        });
        let n = new Zn();
        return (e, ...t) => {
          (n.measure(),
            this.logEntry({
              level: `info`,
              message: `${e} ${zt(`${n.deltaTime}ms`)}`,
              positionals: t,
              prefix: this.prefix,
              colors: { prefix: `blue` },
            }));
        };
      }
      success(e, ...t) {
        this.logEntry({
          level: `info`,
          message: e,
          positionals: t,
          prefix: `\u2714 ${this.prefix}`,
          colors: { timestamp: `green`, prefix: `green` },
        });
      }
      warning(e, ...t) {
        this.logEntry({
          level: `warning`,
          message: e,
          positionals: t,
          prefix: `\u26A0 ${this.prefix}`,
          colors: { timestamp: `yellow`, prefix: `yellow` },
        });
      }
      error(e, ...t) {
        this.logEntry({
          level: `error`,
          message: e,
          positionals: t,
          prefix: `\u2716 ${this.prefix}`,
          colors: { timestamp: `red`, prefix: `red` },
        });
      }
      only(e) {
        e();
      }
      createEntry(e, t) {
        return { timestamp: new Date(), level: e, message: t };
      }
      logEntry(e) {
        let {
            level: t,
            message: n,
            prefix: r,
            colors: i,
            positionals: a = [],
          } = e,
          o = this.createEntry(t, n),
          s = i?.timestamp || `gray`,
          c = i?.prefix || `gray`,
          l = { timestamp: Yn[s], prefix: Yn[c] };
        this.getWriter(t)(
          [l.timestamp(this.formatTimestamp(o.timestamp))]
            .concat(r == null ? [] : l.prefix(r), Kt(n))
            .join(` `),
          ...a.map(Kt),
        );
      }
      formatTimestamp(e) {
        return `${e.toLocaleTimeString(`en-GB`)}:${e.getMilliseconds()}`;
      }
      getWriter(e) {
        switch (e) {
          case `debug`:
          case `success`:
          case `info`:
            return Ht;
          case `warning`:
            return Ut;
          case `error`:
            return Wt;
        }
      }
    }),
    (Zn = class {
      startTime;
      endTime;
      deltaTime;
      constructor() {
        this.startTime = performance.now();
      }
      measure() {
        this.endTime = performance.now();
        let e = this.endTime - this.startTime;
        this.deltaTime = e.toFixed(2);
      }
    }),
    (I = () => void 0),
    (Qn = class extends Error {
      constructor(e, t, n) {
        (super(
          `Possible EventEmitter memory leak detected. ${n} ${t.toString()} listeners added. Use emitter.setMaxListeners() to increase limit`,
        ),
          (this.emitter = e),
          (this.type = t),
          (this.count = n),
          (this.name = `MaxListenersExceededWarning`));
      }
    }),
    ($n = class {
      static listenerCount(e, t) {
        return e.listenerCount(t);
      }
      constructor() {
        ((this.events = new Map()),
          (this.maxListeners = $n.defaultMaxListeners),
          (this.hasWarnedAboutPotentialMemoryLeak = !1));
      }
      _emitInternalEvent(e, t, n) {
        this.emit(e, t, n);
      }
      _getListeners(e) {
        return Array.prototype.concat.apply([], this.events.get(e)) || [];
      }
      _removeListener(e, t) {
        let n = e.indexOf(t);
        return (n > -1 && e.splice(n, 1), []);
      }
      _wrapOnceListener(e, t) {
        let n = (...r) => (this.removeListener(e, n), t.apply(this, r));
        return (Object.defineProperty(n, "name", { value: t.name }), n);
      }
      setMaxListeners(e) {
        return ((this.maxListeners = e), this);
      }
      getMaxListeners() {
        return this.maxListeners;
      }
      eventNames() {
        return Array.from(this.events.keys());
      }
      emit(e, ...t) {
        let n = this._getListeners(e);
        return (
          n.forEach((e) => {
            e.apply(this, t);
          }),
          n.length > 0
        );
      }
      addListener(e, t) {
        this._emitInternalEvent(`newListener`, e, t);
        let n = this._getListeners(e).concat(t);
        if (
          (this.events.set(e, n),
          this.maxListeners > 0 &&
            this.listenerCount(e) > this.maxListeners &&
            !this.hasWarnedAboutPotentialMemoryLeak)
        ) {
          this.hasWarnedAboutPotentialMemoryLeak = !0;
          let t = new Qn(this, e, this.listenerCount(e));
          console.warn(t);
        }
        return this;
      }
      on(e, t) {
        return this.addListener(e, t);
      }
      once(e, t) {
        return this.addListener(e, this._wrapOnceListener(e, t));
      }
      prependListener(e, t) {
        let n = this._getListeners(e);
        if (n.length > 0) {
          let r = [t].concat(n);
          this.events.set(e, r);
        } else this.events.set(e, n.concat(t));
        return this;
      }
      prependOnceListener(e, t) {
        return this.prependListener(e, this._wrapOnceListener(e, t));
      }
      removeListener(e, t) {
        let n = this._getListeners(e);
        return (
          n.length > 0 &&
            (this._removeListener(n, t),
            this.events.set(e, n),
            this._emitInternalEvent(`removeListener`, e, t)),
          this
        );
      }
      off(e, t) {
        return this.removeListener(e, t);
      }
      removeAllListeners(e) {
        return (e ? this.events.delete(e) : this.events.clear(), this);
      }
      listeners(e) {
        return Array.from(this._getListeners(e));
      }
      listenerCount(e) {
        return this._getListeners(e).length;
      }
      rawListeners(e) {
        return this.listeners(e);
      }
    }),
    (er = $n),
    (er.defaultMaxListeners = 10),
    (tr = `x-interceptors-internal-request-id`),
    (L = (function (e) {
      return (
        (e.INACTIVE = `INACTIVE`),
        (e.APPLYING = `APPLYING`),
        (e.APPLIED = `APPLIED`),
        (e.DISPOSING = `DISPOSING`),
        (e.DISPOSED = `DISPOSED`),
        e
      );
    })({})),
    (nr = class {
      constructor(e) {
        ((this.symbol = e),
          (this.readyState = L.INACTIVE),
          (this.emitter = new er()),
          (this.subscriptions = []),
          (this.logger = new Xn(e.description)),
          this.emitter.setMaxListeners(0),
          this.logger.info(`constructing the interceptor...`));
      }
      checkEnvironment() {
        return !0;
      }
      apply() {
        let e = this.logger.extend(`apply`);
        if (
          (e.info(`applying the interceptor...`), this.readyState === L.APPLIED)
        ) {
          e.info(`intercepted already applied!`);
          return;
        }
        if (!this.checkEnvironment()) {
          e.info(`the interceptor cannot be applied in this environment!`);
          return;
        }
        this.readyState = L.APPLYING;
        let t = this.getInstance();
        if (t) {
          (e.info(`found a running instance, reusing...`),
            (this.on = (n, r) => (
              e.info(`proxying the "%s" listener`, n),
              t.emitter.addListener(n, r),
              this.subscriptions.push(() => {
                (t.emitter.removeListener(n, r),
                  e.info(`removed proxied "%s" listener!`, n));
              }),
              this
            )),
            (this.readyState = L.APPLIED));
          return;
        }
        (e.info(`no running instance found, setting up a new instance...`),
          this.setup(),
          this.setInstance(),
          (this.readyState = L.APPLIED));
      }
      setup() {}
      on(e, t) {
        let n = this.logger.extend(`on`);
        return this.readyState === L.DISPOSING || this.readyState === L.DISPOSED
          ? (n.info(`cannot listen to events, already disposed!`), this)
          : (n.info(`adding "%s" event listener:`, e, t),
            this.emitter.on(e, t),
            this);
      }
      once(e, t) {
        return (this.emitter.once(e, t), this);
      }
      off(e, t) {
        return (this.emitter.off(e, t), this);
      }
      removeAllListeners(e) {
        return (this.emitter.removeAllListeners(e), this);
      }
      dispose() {
        let e = this.logger.extend(`dispose`);
        if (this.readyState === L.DISPOSED) {
          e.info(`cannot dispose, already disposed!`);
          return;
        }
        if (
          (e.info(`disposing the interceptor...`),
          (this.readyState = L.DISPOSING),
          !this.getInstance())
        ) {
          e.info(`no interceptors running, skipping dispose...`);
          return;
        }
        if (
          (this.clearInstance(),
          e.info(`global symbol deleted:`, qt(this.symbol)),
          this.subscriptions.length > 0)
        ) {
          e.info(`disposing of %d subscriptions...`, this.subscriptions.length);
          for (let e of this.subscriptions) e();
          ((this.subscriptions = []),
            e.info(
              `disposed of all subscriptions!`,
              this.subscriptions.length,
            ));
        }
        (this.emitter.removeAllListeners(),
          e.info(`destroyed the listener!`),
          (this.readyState = L.DISPOSED));
      }
      getInstance() {
        let e = qt(this.symbol);
        return (
          this.logger.info(`retrieved global instance:`, e?.constructor?.name),
          e
        );
      }
      setInstance() {
        (Jt(this.symbol, this),
          this.logger.info(`set global instance!`, this.symbol.description));
      }
      clearInstance() {
        (Yt(this.symbol),
          this.logger.info(
            `cleared global instance!`,
            this.symbol.description,
          ));
      }
    }),
    (rr = class {
      #e = new Map();
      applyPatch(e, t, n) {
        let r = this.#e.get(e);
        P(
          !r?.has(t),
          `Failed to replace a global value at "${String(t)}": already replaced.`,
        );
        let i = Qt(e, t);
        if (i === void 0)
          return (
            console.warn(
              `Failed to replace a global value at "${String(t)}": not a global value.`,
            ),
            () => {}
          );
        if (i.descriptor.configurable)
          Object.defineProperty(e, t, {
            value: n(e[t]),
            enumerable: !0,
            configurable: !0,
          });
        else if (i.descriptor.writable) e[t] = n(e[t]);
        else
          throw Error(
            `Failed to patch a non-configurable non-writable property "${t.toString()}"`,
          );
        let a = () => {
          let n = this.#e.get(e);
          n?.has(t) &&
            (i.owner === e
              ? Object.defineProperty(i.owner, t, i.descriptor)
              : Reflect.deleteProperty(e, t),
            n.delete(t),
            n.size === 0 && this.#e.delete(e));
        };
        return (r ? r.set(t, a) : this.#e.set(e, new Map([[t, a]])), a);
      }
      restoreAllPatches() {
        let e = [];
        for (let [, t] of this.#e)
          for (let [, n] of t)
            try {
              n();
            } catch (t) {
              if (t instanceof Error) e.push(t);
              else throw t;
            }
        if (e.length > 0) throw AggregateError(e, `FOO!`);
      }
    }),
    (ir = new rr()),
    (R = class extends Promise {
      #e;
      resolve;
      reject;
      constructor(e = null) {
        let t = en();
        (super((n, r) => {
          (t(n, r), e?.(t.resolve, t.reject));
        }),
          (this.#e = t),
          (this.resolve = this.#e.resolve),
          (this.reject = this.#e.reject));
      }
      get state() {
        return this.#e.state;
      }
      get rejectionReason() {
        return this.#e.rejectionReason;
      }
      then(e, t) {
        return this.#t(super.then(e, t));
      }
      catch(e) {
        return this.#t(super.catch(e));
      }
      finally(e) {
        return this.#t(super.finally(e));
      }
      #t(e) {
        return Object.defineProperties(e, {
          resolve: { configurable: !0, value: this.resolve },
          reject: { configurable: !0, value: this.reject },
        });
      }
    }),
    (z = Symbol(`kCancelable`)),
    (B = Symbol(`kDefaultPrevented`)),
    (ar = class extends MessageEvent {
      constructor(e, t) {
        (super(e, t), (this[z] = !!t.cancelable), (this[B] = !1));
      }
      get cancelable() {
        return this[z];
      }
      set cancelable(e) {
        this[z] = e;
      }
      get defaultPrevented() {
        return this[B];
      }
      set defaultPrevented(e) {
        this[B] = e;
      }
      preventDefault() {
        this.cancelable && !this[B] && (this[B] = !0);
      }
    }),
    (V = class extends Event {
      constructor(e, t = {}) {
        (super(e, t),
          (this.code = t.code === void 0 ? 0 : t.code),
          (this.reason = t.reason === void 0 ? `` : t.reason),
          (this.wasClean = t.wasClean === void 0 ? !1 : t.wasClean));
      }
    }),
    (or = class extends V {
      constructor(e, t = {}) {
        (super(e, t), (this[z] = !!t.cancelable), (this[B] = !1));
      }
      get cancelable() {
        return this[z];
      }
      set cancelable(e) {
        this[z] = e;
      }
      get defaultPrevented() {
        return this[B];
      }
      set defaultPrevented(e) {
        this[B] = e;
      }
      preventDefault() {
        this.cancelable && !this[B] && (this[B] = !0);
      }
    }),
    (H = Symbol(`kEmitter`)),
    (U = Symbol(`kBoundListener`)),
    (sr = class {
      constructor(e, t) {
        ((this.socket = e),
          (this.transport = t),
          (this.id = Xt()),
          (this.url = new URL(e.url)),
          (this[H] = new EventTarget()),
          this.transport.addEventListener(`outgoing`, (e) => {
            let t = j(
              this.socket,
              new ar(`message`, {
                data: e.data,
                origin: e.origin,
                cancelable: !0,
              }),
            );
            (this[H].dispatchEvent(t),
              t.defaultPrevented && e.preventDefault());
          }),
          this.transport.addEventListener(`close`, (e) => {
            this[H].dispatchEvent(j(this.socket, new V(`close`, e)));
          }));
      }
      addEventListener(e, t, n) {
        if (!Reflect.has(t, U)) {
          let e = t.bind(this.socket);
          Object.defineProperty(t, U, {
            value: e,
            enumerable: !1,
            configurable: !1,
          });
        }
        this[H].addEventListener(e, Reflect.get(t, U), n);
      }
      removeEventListener(e, t, n) {
        this[H].removeEventListener(e, Reflect.get(t, U), n);
      }
      send(e) {
        this.transport.send(e);
      }
      close(e, t) {
        this.transport.close(e, t);
      }
    }),
    (cr = `InvalidAccessError: close code out of user configurable range`),
    (W = Symbol(`kPassthroughPromise`)),
    (lr = Symbol(`kOnSend`)),
    (G = Symbol(`kClose`)),
    (ur = class extends EventTarget {
      static {
        this.CONNECTING = 0;
      }
      static {
        this.OPEN = 1;
      }
      static {
        this.CLOSING = 2;
      }
      static {
        this.CLOSED = 3;
      }
      constructor(e, t) {
        (super(),
          (this.CONNECTING = 0),
          (this.OPEN = 1),
          (this.CLOSING = 2),
          (this.CLOSED = 3),
          (this._onopen = null),
          (this._onmessage = null),
          (this._onerror = null),
          (this._onclose = null),
          (this.url = Zt(e)),
          (this.protocol = ``),
          (this.extensions = ``),
          (this.binaryType = `blob`),
          (this.readyState = this.CONNECTING),
          (this.bufferedAmount = 0),
          (this[W] = new R()),
          queueMicrotask(async () => {
            (await this[W]) ||
              ((this.protocol =
                typeof t == `string`
                  ? t
                  : Array.isArray(t) && t.length > 0
                    ? t[0]
                    : ``),
              this.readyState === this.CONNECTING &&
                ((this.readyState = this.OPEN),
                this.dispatchEvent(j(this, new Event(`open`)))));
          }));
      }
      set onopen(e) {
        (this.removeEventListener(`open`, this._onopen),
          (this._onopen = e),
          e !== null && this.addEventListener(`open`, e));
      }
      get onopen() {
        return this._onopen;
      }
      set onmessage(e) {
        (this.removeEventListener(`message`, this._onmessage),
          (this._onmessage = e),
          e !== null && this.addEventListener(`message`, e));
      }
      get onmessage() {
        return this._onmessage;
      }
      set onerror(e) {
        (this.removeEventListener(`error`, this._onerror),
          (this._onerror = e),
          e !== null && this.addEventListener(`error`, e));
      }
      get onerror() {
        return this._onerror;
      }
      set onclose(e) {
        (this.removeEventListener(`close`, this._onclose),
          (this._onclose = e),
          e !== null && this.addEventListener(`close`, e));
      }
      get onclose() {
        return this._onclose;
      }
      send(e) {
        if (this.readyState === this.CONNECTING)
          throw (this.close(), new DOMException(`InvalidStateError`));
        this.readyState === this.CLOSING ||
          this.readyState === this.CLOSED ||
          ((this.bufferedAmount += tn(e)),
          queueMicrotask(() => {
            ((this.bufferedAmount = 0), this[lr]?.(e));
          }));
      }
      close(e = 1e3, t) {
        (P(e, cr), P(e === 1e3 || (e >= 3e3 && e <= 4999), cr), this[G](e, t));
      }
      [G](e = 1e3, t, n = !0) {
        this.readyState === this.CLOSING ||
          this.readyState === this.CLOSED ||
          ((this.readyState = this.CLOSING),
          queueMicrotask(() => {
            ((this.readyState = this.CLOSED),
              this.dispatchEvent(
                j(this, new V(`close`, { code: e, reason: t, wasClean: n })),
              ),
              (this._onopen = null),
              (this._onmessage = null),
              (this._onerror = null),
              (this._onclose = null));
          }));
      }
      addEventListener(e, t, n) {
        return super.addEventListener(e, t, n);
      }
      removeEventListener(e, t, n) {
        return super.removeEventListener(e, t, n);
      }
    }),
    (K = Symbol(`kEmitter`)),
    (q = Symbol(`kBoundListener`)),
    (dr = Symbol(`kSend`)),
    (fr = class {
      constructor(e, t, n) {
        ((this.client = e),
          (this.transport = t),
          (this.createConnection = n),
          (this[K] = new EventTarget()),
          (this.mockCloseController = new AbortController()),
          (this.realCloseController = new AbortController()),
          this.transport.addEventListener(`outgoing`, (e) => {
            this.realWebSocket !== void 0 &&
              queueMicrotask(() => {
                e.defaultPrevented || this[dr](e.data);
              });
          }),
          this.transport.addEventListener(
            `incoming`,
            this.handleIncomingMessage.bind(this),
          ));
      }
      get socket() {
        return (
          P(
            this.realWebSocket,
            'Cannot access "socket" on the original WebSocket server object: the connection is not open. Did you forget to call `server.connect()`?',
          ),
          this.realWebSocket
        );
      }
      connect() {
        P(
          !this.realWebSocket ||
            this.realWebSocket.readyState !== WebSocket.OPEN,
          `Failed to call "connect()" on the original WebSocket instance: the connection already open`,
        );
        let e = this.createConnection();
        ((e.binaryType = this.client.binaryType),
          e.addEventListener(
            `open`,
            (e) => {
              this[K].dispatchEvent(
                j(this.realWebSocket, new Event(`open`, e)),
              );
            },
            { once: !0 },
          ),
          e.addEventListener(`message`, (e) => {
            this.transport.dispatchEvent(
              j(
                this.realWebSocket,
                new MessageEvent(`incoming`, {
                  data: e.data,
                  origin: e.origin,
                }),
              ),
            );
          }),
          this.client.addEventListener(
            `close`,
            (e) => {
              this.handleMockClose(e);
            },
            { signal: this.mockCloseController.signal },
          ),
          e.addEventListener(
            `close`,
            (e) => {
              this.handleRealClose(e);
            },
            { signal: this.realCloseController.signal },
          ),
          e.addEventListener(`error`, () => {
            let t = j(e, new Event(`error`, { cancelable: !0 }));
            (this[K].dispatchEvent(t),
              t.defaultPrevented ||
                this.client.dispatchEvent(j(this.client, new Event(`error`))));
          }),
          (this.realWebSocket = e));
      }
      addEventListener(e, t, n) {
        if (!Reflect.has(t, q)) {
          let e = t.bind(this.client);
          Object.defineProperty(t, q, { value: e, enumerable: !1 });
        }
        this[K].addEventListener(e, Reflect.get(t, q), n);
      }
      removeEventListener(e, t, n) {
        this[K].removeEventListener(e, Reflect.get(t, q), n);
      }
      send(e) {
        this[dr](e);
      }
      [dr](e) {
        let { realWebSocket: t } = this;
        if (
          (P(
            t,
            `Failed to call "server.send()" for "%s": the connection is not open. Did you forget to call "server.connect()"?`,
            this.client.url,
          ),
          !(
            t.readyState === WebSocket.CLOSING ||
            t.readyState === WebSocket.CLOSED
          ))
        ) {
          if (t.readyState === WebSocket.CONNECTING) {
            t.addEventListener(
              `open`,
              () => {
                t.send(e);
              },
              { once: !0 },
            );
            return;
          }
          t.send(e);
        }
      }
      close() {
        let { realWebSocket: e } = this;
        (P(
          e,
          `Failed to close server connection for "%s": the connection is not open. Did you forget to call "server.connect()"?`,
          this.client.url,
        ),
          this.realCloseController.abort(),
          !(
            e.readyState === WebSocket.CLOSING ||
            e.readyState === WebSocket.CLOSED
          ) &&
            (e.close(),
            queueMicrotask(() => {
              this[K].dispatchEvent(
                j(
                  this.realWebSocket,
                  new or(`close`, { code: 1e3, cancelable: !0 }),
                ),
              );
            })));
      }
      handleIncomingMessage(e) {
        let t = j(
          e.target,
          new ar(`message`, { data: e.data, origin: e.origin, cancelable: !0 }),
        );
        (this[K].dispatchEvent(t),
          t.defaultPrevented ||
            this.client.dispatchEvent(
              j(
                this.client,
                new MessageEvent(`message`, { data: e.data, origin: e.origin }),
              ),
            ));
      }
      handleMockClose(e) {
        this.realWebSocket && this.realWebSocket.close();
      }
      handleRealClose(e) {
        this.mockCloseController.abort();
        let t = j(
          this.realWebSocket,
          new or(`close`, {
            code: e.code,
            reason: e.reason,
            wasClean: e.wasClean,
            cancelable: !0,
          }),
        );
        (this[K].dispatchEvent(t),
          t.defaultPrevented || this.client[G](e.code, e.reason));
      }
    }),
    (pr = class extends EventTarget {
      constructor(e) {
        (super(),
          (this.socket = e),
          this.socket.addEventListener(`close`, (e) => {
            this.dispatchEvent(j(this.socket, new V(`close`, e)));
          }),
          (this.socket[lr] = (e) => {
            this.dispatchEvent(
              j(
                this.socket,
                new ar(`outgoing`, {
                  data: e,
                  origin: this.socket.url,
                  cancelable: !0,
                }),
              ),
            );
          }));
      }
      addEventListener(e, t, n) {
        return super.addEventListener(e, t, n);
      }
      dispatchEvent(e) {
        return super.dispatchEvent(e);
      }
      send(e) {
        queueMicrotask(() => {
          if (
            this.socket.readyState === this.socket.CLOSING ||
            this.socket.readyState === this.socket.CLOSED
          )
            return;
          let t = () => {
            this.socket.dispatchEvent(
              j(
                this.socket,
                new MessageEvent(`message`, {
                  data: e,
                  origin: this.socket.url,
                }),
              ),
            );
          };
          this.socket.readyState === this.socket.CONNECTING
            ? this.socket.addEventListener(
                `open`,
                () => {
                  t();
                },
                { once: !0 },
              )
            : t();
        });
      }
      close(e, t) {
        this.socket[G](e, t);
      }
    }),
    (mr = class e extends nr {
      static {
        this.symbol = Symbol.for(`websocket-interceptor`);
      }
      constructor() {
        super(e.symbol);
      }
      checkEnvironment() {
        return $t(`WebSocket`);
      }
      setup() {
        let e = this.logger.extend(`setup`),
          t = new Proxy(globalThis.WebSocket, {
            construct: (e, t, n) => {
              let [r, i] = t,
                a = () => Reflect.construct(e, t, n),
                o = new ur(r, i),
                s = new pr(o);
              return (
                queueMicrotask(async () => {
                  try {
                    let e = new fr(o, s, a),
                      t = this.emitter.listenerCount(`connection`) > 0;
                    (await A(this.emitter, `connection`, {
                      client: new sr(o, s),
                      server: e,
                      info: { protocols: i },
                    }),
                      t
                        ? o[W].resolve(!1)
                        : (o[W].resolve(!0),
                          e.connect(),
                          e.addEventListener(`open`, () => {
                            (o.dispatchEvent(j(o, new Event(`open`))),
                              e.realWebSocket &&
                                (o.protocol = e.realWebSocket.protocol));
                          })));
                  } catch (e) {
                    e instanceof Error &&
                      (o.dispatchEvent(new Event(`error`)),
                      o.readyState !== WebSocket.CLOSING &&
                        o.readyState !== WebSocket.CLOSED &&
                        o[G](1011, e.message, !1),
                      console.error(e));
                  }
                }),
                o
              );
            },
          });
        (e.info(`patching global WebSocket...`),
          this.subscriptions.push(
            ir.applyPatch(globalThis, `WebSocket`, () => t),
          ),
          e.info(`global WebSocket patched!`, globalThis.WebSocket.name));
      }
    }),
    (J = class extends Promise {
      #e;
      resolve;
      reject;
      constructor(e = null) {
        let t = an();
        (super((n, r) => {
          (t(n, r), e?.(t.resolve, t.reject));
        }),
          (this.#e = t),
          (this.resolve = this.#e.resolve),
          (this.reject = this.#e.reject));
      }
      get state() {
        return this.#e.state;
      }
      get rejectionReason() {
        return this.#e.rejectionReason;
      }
      then(e, t) {
        return this.#t(super.then(e, t));
      }
      catch(e) {
        return this.#t(super.catch(e));
      }
      finally(e) {
        return this.#t(super.finally(e));
      }
      #t(e) {
        return Object.defineProperties(e, {
          resolve: { configurable: !0, value: this.resolve },
          reject: { configurable: !0, value: this.reject },
        });
      }
    }),
    (hr = class e extends Error {
      constructor(t) {
        (super(t),
          (this.name = `InterceptorError`),
          Object.setPrototypeOf(this, e.prototype));
      }
    }),
    (Y = class e {
      static {
        this.PENDING = 0;
      }
      static {
        this.PASSTHROUGH = 1;
      }
      static {
        this.RESPONSE = 2;
      }
      static {
        this.ERROR = 3;
      }
      constructor(t, n) {
        ((this.request = t),
          (this.source = n),
          (this.readyState = e.PENDING),
          (this.handled = new R()));
      }
      get #e() {
        return this.handled;
      }
      async passthrough() {
        (P.as(
          hr,
          this.readyState === e.PENDING,
          `Failed to passthrough the "%s %s" request: the request has already been handled`,
          this.request.method,
          this.request.url,
        ),
          (this.readyState = e.PASSTHROUGH),
          await this.source.passthrough(),
          this.#e.resolve());
      }
      respondWith(t) {
        (P.as(
          hr,
          this.readyState === e.PENDING,
          `Failed to respond to the "%s %s" request with "%d %s": the request has already been handled (%d)`,
          this.request.method,
          this.request.url,
          t.status,
          t.statusText || `OK`,
          this.readyState,
        ),
          (this.readyState = e.RESPONSE),
          this.#e.resolve(),
          this.source.respondWith(t));
      }
      errorWith(t) {
        (P.as(
          hr,
          this.readyState === e.PENDING,
          `Failed to error the "%s %s" request with "%s": the request has already been handled (%d)`,
          this.request.method,
          this.request.url,
          t?.toString(),
          this.readyState,
        ),
          (this.readyState = e.ERROR),
          this.source.errorWith(t),
          this.#e.resolve());
      }
    }),
    (gr = class e extends Request {
      static #e(e, t = {}, n) {
        return t[n] ?? (e instanceof Request ? e[n] : void 0);
      }
      static isConfigurableMethod(e) {
        return e !== `CONNECT` && e !== `TRACE` && e !== `TRACK`;
      }
      static isMethodWithBody(t) {
        return t !== `HEAD` && t !== `GET` && e.isConfigurableMethod(t);
      }
      static isConfigurableMode(e) {
        return e !== `navigate` && e !== `websocket` && e !== `webtransport`;
      }
      constructor(t, n) {
        let r = e.#e(t, n, `method`) || `GET`,
          i = e.isConfigurableMethod(r) ? r : `GET`,
          a = n != null && `body` in n,
          o = e.isMethodWithBody(r)
            ? a
              ? { body: n.body }
              : {}
            : { body: void 0 },
          s = e.#e(t, n, `mode`) ?? void 0,
          c = e.isConfigurableMode(s) ? s : void 0;
        if (
          (super(t, {
            ...(n || {}),
            method: i,
            mode: c,
            duplex: n?.duplex ?? (e.isMethodWithBody(r) ? `half` : void 0),
            ...o,
          }),
          r !== i && this.#t(`method`, r),
          r === `CONNECT`)
        ) {
          let e = new URL(t instanceof Request ? t.url : t),
            n;
          ((n =
            e.protocol === `localhost:`
              ? e.href
              : e.pathname.replace(/^\/+/, ``)),
            Object.defineProperty(this, "url", {
              get: () => n,
              enumerable: !0,
              configurable: !0,
            }));
        }
        s != null && s !== c && this.#t(`mode`, s);
      }
      #t(e, t) {
        let n = sn(`state`, this);
        n
          ? Reflect.set(n, e, t)
          : Object.defineProperty(this, e, {
              value: t,
              enumerable: !0,
              configurable: !0,
              writable: !1,
            });
      }
    }),
    (_r = Symbol(`kStatus`)),
    (vr = Symbol(`kUrl`)),
    (X = class e extends Response {
      static {
        this.STATUS_CODES_WITHOUT_BODY = [101, 103, 204, 205, 304];
      }
      static {
        this.STATUS_CODES_WITH_REDIRECT = [301, 302, 303, 307, 308];
      }
      static isConfigurableStatusCode(e) {
        return e >= 200 && e <= 599;
      }
      static isRedirectResponse(t) {
        return e.STATUS_CODES_WITH_REDIRECT.includes(t);
      }
      static isResponseWithBody(t) {
        return !e.STATUS_CODES_WITHOUT_BODY.includes(t);
      }
      static setStatus(e, t) {
        let n = sn(`state`, t);
        (n
          ? (n.status = e)
          : Object.defineProperty(t, "status", {
              value: e,
              enumerable: !0,
              configurable: !0,
              writable: !1,
            }),
          Object.defineProperty(t, _r, { value: e, enumerable: !1 }));
      }
      static setUrl(e, t) {
        if (!e || e === `about:` || !on(e)) return;
        let n = sn(`state`, t);
        (n
          ? n.urlList.push(new URL(e))
          : Object.defineProperty(t, "url", {
              value: e,
              enumerable: !0,
              configurable: !0,
              writable: !1,
            }),
          Object.defineProperty(t, vr, { value: e, enumerable: !1 }));
      }
      static parseRawHeaders(e) {
        let t = new Headers();
        for (let n = 0; n < e.length; n += 2) t.append(e[n], e[n + 1]);
        return t;
      }
      static clone(e) {
        try {
          return e.clone();
        } catch (e) {
          return Response.json(
            e instanceof Error
              ? { name: e.name, message: e.message, stack: e.stack }
              : {},
            { status: 500, statusText: `Unclonable Response` },
          );
        }
      }
      constructor(t, n = {}) {
        let r = n.status ?? 200,
          i = e.isConfigurableStatusCode(r) ? r : 200,
          a = e.isResponseWithBody(r) ? t : null;
        (super(a, { status: i, statusText: n.statusText, headers: n.headers }),
          r !== i && e.setStatus(r, this),
          e.setUrl(n.url, this));
      }
      clone() {
        let t = super.clone(),
          n = Reflect.get(this, _r);
        n && e.setStatus(n, t);
        let r = Reflect.get(this, vr);
        return (r && e.setUrl(r, t), t);
      }
    }),
    (yr = Symbol(`kRawRequest`)),
    (br = new TextEncoder()),
    (xr = async (e, t = {}, n) => {
      let r = pn(e),
        i = await navigator.serviceWorker
          .getRegistrations()
          .then((e) => e.filter((e) => mn(e, r, n)));
      !navigator.serviceWorker.controller && i.length > 0 && location.reload();
      let [a] = i;
      if (a) return (a.update(), [mn(a, r, n), a]);
      let [o, s] = await fn(async () => {
        let i = await navigator.serviceWorker.register(e, t);
        return [mn(i, r, n), i];
      });
      if (o) {
        if (o.message.includes(`(404)`)) {
          let e = new URL(t?.scope || `/`, location.href);
          throw Error(
            f.formatMessage(`Failed to register a Service Worker for scope ('${e.href}') with script ('${r}'): Service Worker script does not exist at the given path.

Did you forget to run "npx msw init <PUBLIC_DIR>"?

Learn more about creating the Service Worker script: https://mswjs.io/docs/cli/init`),
          );
        }
        throw Error(
          f.formatMessage(
            `Failed to register the Service Worker:

%s`,
            o.message,
          ),
        );
      }
      return s;
    }),
    (Sr = class {
      #e;
      #t;
      constructor() {
        ((this.#e = []), (this.#t = new Map()));
      }
      get [Symbol.iterator]() {
        return this.#e[Symbol.iterator].bind(this.#e);
      }
      entries() {
        return this.#t.entries();
      }
      get(e) {
        return this.#t.get(e) || [];
      }
      getAll() {
        return this.#e.map(([, e]) => e);
      }
      append(e, t) {
        (this.#e.push([e, t]), this.#n(e, (e) => e.push(t)));
      }
      prepend(e, t) {
        (this.#e.unshift([e, t]), this.#n(e, (e) => e.unshift(t)));
      }
      delete(e, t) {
        if (this.size === 0) return !1;
        let n = this.#t.get(e);
        if (!n) return !1;
        let r = n.indexOf(t);
        return r === -1
          ? !1
          : (n.splice(r, 1),
            this.#e.splice(
              this.#e.findIndex((n) => n[0] === e && n[1] === t),
              1,
            ),
            !0);
      }
      deleteAll(e) {
        this.size !== 0 &&
          ((this.#e = this.#e.filter((t) => t[0] !== e)), this.#t.delete(e));
      }
      get size() {
        return this.#e.length;
      }
      clear() {
        this.size !== 0 && ((this.#e.length = 0), this.#t.clear());
      }
      #n(e, t) {
        t(this.#t.get(e) || this.#t.set(e, []).get(e));
      }
    }),
    (Cr = Symbol(`kDefaultPrevented`)),
    (Z = Symbol(`kPropagationStopped`)),
    (Q = Symbol(`kImmediatePropagationStopped`)),
    (wr = class extends MessageEvent {
      [Cr];
      [Z];
      [Q];
      constructor(...e) {
        (super(e[0], e[1]), (this[Cr] = !1));
      }
      get defaultPrevented() {
        return this[Cr];
      }
      preventDefault() {
        (super.preventDefault(), (this[Cr] = !0));
      }
      stopImmediatePropagation() {
        (super.stopImmediatePropagation(), (this[Q] = !0));
      }
    }),
    (Tr = class {
      #e;
      #t;
      #n;
      #r;
      #i;
      #a;
      #o;
      hooks;
      constructor() {
        ((this.#e = new Sr()),
          (this.#t = new WeakMap()),
          (this.#n = new WeakMap()),
          (this.#r = new WeakSet()),
          (this.#i = new Sr()),
          (this.#a = new WeakMap()),
          (this.#o = new WeakMap()),
          (this.hooks = {
            on: (e, t, n) => {
              if (!n?.signal?.aborted) {
                if (n?.once) {
                  let n = t,
                    r = (...t) => (this.#s(e, r), n(...t));
                  t = r;
                }
                if ((this.#i.append(e, t), n && this.#a.set(t, n), n?.signal)) {
                  let { signal: r } = n,
                    i = () => {
                      this.#s(e, t);
                    };
                  (r.addEventListener(`abort`, i, { once: !0 }),
                    this.#o.set(t, () => {
                      r.removeEventListener(`abort`, i);
                    }));
                }
              }
            },
            removeListener: (e, t) => {
              this.#s(e, t);
            },
          }));
      }
      #s(e, t) {
        this.#i.delete(e, t);
        let n = this.#o.get(t);
        n && (n(), this.#o.delete(t));
      }
      #c(e, t) {
        let n = this.#e.delete(e, t),
          r = this.#n.get(t);
        return (r && (r(), this.#n.delete(t)), n);
      }
      on(e, t, n) {
        return (this.#l(e, t, n), this);
      }
      once(e, t, n) {
        return this.on(e, t, { ...(n || {}), once: !0 });
      }
      earlyOn(e, t, n) {
        return (this.#l(e, t, n, `prepend`), this);
      }
      earlyOnce(e, t, n) {
        return this.earlyOn(e, t, { ...(n || {}), once: !0 });
      }
      emit(e) {
        if (this.#e.size === 0) return !1;
        let t = this.listenerCount(e.type) > 0,
          n = this.#u(e);
        for (let t of this.#f(e.type)) {
          if (n.event[Z] != null && n.event[Z] !== this)
            return (n.revoke(), !1);
          if (n.event[Q]) break;
          this.#d(n.event, t);
        }
        return (n.revoke(), t);
      }
      async emitAsPromise(e) {
        if (this.#e.size === 0) return [];
        let t = [],
          n = this.#u(e);
        for (let r of this.#f(e.type)) {
          if (n.event[Z] != null && n.event[Z] !== this)
            return (n.revoke(), []);
          if (n.event[Q]) break;
          let e = await Promise.resolve(this.#d(n.event, r));
          this.#p(r) || t.push(e);
        }
        return (
          n.revoke(),
          Promise.allSettled(t).then((e) =>
            e.map((e) => (e.status === `fulfilled` ? e.value : e.reason)),
          )
        );
      }
      *emitAsGenerator(e) {
        if (this.#e.size === 0) return;
        let t = this.#u(e);
        for (let n of this.#f(e.type)) {
          if (t.event[Z] != null && t.event[Z] !== this) {
            t.revoke();
            return;
          }
          if (t.event[Q]) break;
          let e = this.#d(t.event, n);
          this.#p(n) || (yield e);
        }
        t.revoke();
      }
      removeListener(e, t) {
        let n = this.#t.get(t);
        if (this.#c(e, t))
          for (let r of this.#i.get(`removeListener`).slice()) r(e, t, n);
      }
      removeAllListeners(e) {
        if (e == null) {
          for (let [e, t] of this.#e.entries())
            for (; t.length > 0;) this.removeListener(e, t[0]);
          for (let [e, t] of [...this.#i])
            this.#a.get(t)?.persist || this.#s(e, t);
          return;
        }
        let t = this.listeners(e);
        for (; t.length > 0;) this.removeListener(e, t[0]);
      }
      listeners(e) {
        return e == null ? this.#e.getAll() : this.#e.get(e);
      }
      listenerCount(e) {
        return e == null ? this.#e.size : this.listeners(e).length;
      }
      #l(e, t, n, r = `append`) {
        if (!n?.signal?.aborted) {
          for (let r of this.#i.get(`newListener`).slice()) r(e, t, n);
          if (
            (e === `*` && this.#r.add(t),
            r === `prepend` ? this.#e.prepend(e, t) : this.#e.append(e, t),
            n && (this.#t.set(t, n), n.signal))
          ) {
            let { signal: r } = n,
              i = () => {
                this.removeListener(e, t);
              };
            (r.addEventListener(`abort`, i, { once: !0 }),
              this.#n.set(t, () => {
                r.removeEventListener(`abort`, i);
              }));
          }
        }
      }
      #u(e) {
        let { stopPropagation: t } = e;
        return (
          (e.stopPropagation = () => {
            ((e[Z] = this), t.call(e));
          }),
          {
            event: e,
            revoke() {
              e.stopPropagation = t;
            },
          }
        );
      }
      #d(e, t) {
        for (let t of this.#i.get(`beforeEmit`).slice())
          if (t(e) === !1) return;
        let n = t.call(this, e),
          r = this.#t.get(t);
        if (r?.once) {
          let n = this.#p(t) ? `*` : e.type;
          if (this.#c(n, t))
            for (let e of this.#i.get(`removeListener`).slice()) e(n, t, r);
        }
        return n;
      }
      *#f(e) {
        let t = [];
        for (let [n, r] of this.#e) (n === `*` || n === e) && t.push(r);
        yield* t;
      }
      #p(e) {
        return this.#r.has(e);
      }
    }),
    (Er = nn()),
    (Dr = class extends wr {
      #e;
      constructor(e) {
        let t = e.data.type,
          n = e.data.payload;
        (super(t, { data: n }), (this.#e = e));
      }
      get ports() {
        return this.#e.ports;
      }
      postMessage(e, ...t) {
        this.#e.ports[0].postMessage(
          { type: e, data: t[0] },
          { transfer: t[1] },
        );
      }
    }),
    (Or = class extends Tr {
      #e;
      #t;
      constructor(e) {
        (super(),
          P(
            Er,
            `Failed to open a WorkerChannel: Service Worker is not supported in this environment.`,
          ),
          (this.#e = e.getWorker),
          (this.#t = new AbortController()),
          navigator.serviceWorker.addEventListener(
            `message`,
            async (e) => {
              let t = await this.#e();
              (e.source != null && e.source !== t) ||
                (e.data &&
                  xe(e.data) &&
                  `type` in e.data &&
                  this.emit(new Dr(e)));
            },
            { signal: this.#t.signal },
          ));
      }
      postMessage(e) {
        (P(
          Er,
          `Failed to post message on a WorkerChannel: the Service Worker API is unavailable in this environment. This is likely an issue with MSW. Please report it on GitHub: https://github.com/mswjs/msw/issues`,
        ),
          this.#e().then((t) => {
            t.postMessage(e);
          }));
      }
      terminate() {
        (this.#t.abort(), this.removeAllListeners());
      }
    }),
    (kr = class e extends Ve {
      static #e;
      static async from(t) {
        return (
          e.#e == null
            ? (e.#e = new e(t))
            : vn(e.#e.#t, t) && (await e.#e.terminate(), (e.#e = new e(t))),
          e.#e
        );
      }
      #t;
      #n;
      #r;
      #i;
      #a;
      #o;
      #s;
      workerPromise;
      constructor(e) {
        (super(),
          P(
            nn(),
            `Failed to use Service Worker as the network source: the Service Worker API is not supported in this environment`,
          ),
          (this.#t = e),
          (this.#n = new Map()),
          (this.workerPromise = new J()),
          (this.#r = new Or({
            getWorker: () => this.workerPromise.then(([e]) => e),
          })));
      }
      async enable() {
        if (this.workerPromise.state === `fulfilled` && this.#s === void 0)
          return (
            f.warn(
              `Found a redundant "worker.start()" call. Note that starting the worker while mocking is already enabled will have no effect. Consider removing this "worker.start()" call.`,
            ),
            this.workerPromise.then(([, e]) => e)
          );
        ((this.#s = void 0),
          this.#r.removeAllListeners(),
          this.#n.clear(),
          (this.#i = new AbortController()));
        let [e, t] = await this.#c();
        if (e.state !== `activated`) {
          let t = new AbortController(),
            n = new J();
          (n.then(() => t.abort()),
            e.addEventListener(
              `statechange`,
              () => {
                e.state === `activated` && n.resolve();
              },
              { signal: t.signal },
            ),
            await n);
        }
        this.#r.postMessage(`MOCK_ACTIVATE`);
        let n = new J();
        return (
          (this.#a = n),
          this.#r.once(`MOCKING_ENABLED`, (e) => {
            n.resolve(e.data.client);
          }),
          await n,
          this.#t.quiet || this.#p(),
          t
        );
      }
      disable() {
        if (this.#s !== void 0) {
          f.warn(
            `Found a redundant "worker.stop()" call. Notice that stopping the worker after it has already been stopped has no effect. Consider removing this "worker.stop()" call.`,
          );
          return;
        }
        ((this.#s = Date.now()),
          this.#i?.abort(),
          (this.#i = void 0),
          this.#r.postMessage(`CLIENT_CLOSED`),
          this.#t.quiet || this.#m());
      }
      async terminate() {
        if (
          (this.#o != null && (clearInterval(this.#o), (this.#o = void 0)),
          this.#n.clear(),
          this.#r.terminate(),
          this.#i?.abort(),
          (this.#i = void 0),
          this.workerPromise.state === `fulfilled`)
        ) {
          let [, e] = await this.workerPromise;
          await e.unregister();
        }
        e.#e === this && (e.#e = void 0);
      }
      async #c() {
        this.#o && clearInterval(this.#o);
        let e = this.#t.serviceWorker.url,
          [t, n] = await xr(
            e,
            this.#t.serviceWorker.options,
            this.#t.findWorker || this.#d,
          );
        if (t == null) {
          let t = this.#t?.findWorker
            ? f.formatMessage(
                `Failed to locate the Service Worker registration using a custom "findWorker" predicate.

Please ensure that the custom predicate properly locates the Service Worker registration at "%s".
More details: https://mswjs.io/docs/api/setup-worker/start#findworker
     `,
                e,
              )
            : f.formatMessage(
                `Failed to locate the Service Worker registration.

This most likely means that the worker script URL "%s" cannot resolve against the actual public hostname (%s). This may happen if your application runs behind a proxy, or has a dynamic hostname.

Please consider using a custom "serviceWorker.url" option to point to the actual worker script location, or a custom "findWorker" option to resolve the Service Worker registration manually. More details: https://mswjs.io/docs/api/setup-worker/start`,
                e,
                location.host,
              );
          throw Error(t);
        }
        return (
          this.workerPromise.state === `pending`
            ? this.workerPromise.resolve([t, n])
            : (this.workerPromise = new J((e) => {
                e([t, n]);
              })),
          this.#r.on(`REQUEST`, this.#l.bind(this)),
          this.#r.on(`RESPONSE`, this.#u.bind(this)),
          window.addEventListener(
            `beforeunload`,
            () => {
              (t.state !== `redundant` && this.#r.postMessage(`CLIENT_CLOSED`),
                clearInterval(this.#o),
                window.postMessage({ type: `msw/worker:stop` }));
            },
            { signal: this.#i?.signal },
          ),
          await this.#f().catch((e) => {
            (f.error(
              `Error while checking the worker script integrity. Please report this on GitHub (https://github.com/mswjs/msw/issues) and include the original error below.`,
            ),
              console.error(e));
          }),
          (this.#o = window.setInterval(() => {
            this.#r.postMessage(`KEEPALIVE_REQUEST`);
          }, 5e3)),
          this.#t.quiet || _n(n),
          [t, n]
        );
      }
      async #l(e) {
        if (this.#s && e.data.interceptedAt > this.#s)
          return e.postMessage(`PASSTHROUGH`);
        let t = gn(e.data);
        pe.cache.set(t, t.clone());
        let n = new Ar({ event: e, request: t });
        (this.#n.set(e.data.id, n), await this.queue(n));
      }
      async #u(e) {
        let { request: t, response: n, isMockedResponse: r } = e.data,
          i = this.#n.get(t.id);
        if (n.type?.includes(`opaque`)) {
          (this.#n.delete(t.id), i?.events.removeAllListeners());
          return;
        }
        if ((this.#n.delete(t.id), i == null)) return;
        let a = gn(t),
          o =
            n.status === 0
              ? Response.error()
              : new X(X.isResponseWithBody(n.status) ? n.body : null, {
                  ...n,
                  url: t.url,
                });
        try {
          i.events.emit(
            new qe(r ? `response:mocked` : `response:bypass`, {
              requestId: i.data.id,
              request: a,
              response: o,
              isMockedResponse: r,
            }),
          );
        } finally {
          i.events.removeAllListeners();
        }
      }
      #d = (e, t) => e === t;
      async #f() {
        let e = new J();
        return (
          this.#r.postMessage(`INTEGRITY_CHECK_REQUEST`),
          this.#r.once(`INTEGRITY_CHECK_RESPONSE`, (t) => {
            let { checksum: n, packageVersion: r } = t.data;
            (n !== `03cb67ac84128e63d7cd722a6e5b7f1e` &&
              f.warn(`The currently registered Service Worker has been generated by a different version of MSW (${r}) and may not be fully compatible with the installed version.

It's recommended you update your worker script by running this command:

  \u2022 npx msw init <PUBLIC_DIR>

You can also automate this process and make the worker script update automatically upon the library installations. Read more: https://mswjs.io/docs/cli/init.`),
              e.resolve());
          }),
          e
        );
      }
      async #p() {
        if (this.workerPromise.state === `rejected`) return;
        P(
          this.#a != null,
          `[ServiceWorkerSource] Failed to print a start message: client confirmation not received`,
        );
        let e = await this.#a,
          [t, n] = await this.workerPromise;
        (console.groupCollapsed(
          `%c${f.formatMessage(`Mocking enabled.`)}`,
          `color:orangered;font-weight:bold;`,
        ),
          console.log(
            `%cDocumentation: %chttps://mswjs.io/docs`,
            `font-weight:bold`,
            `font-weight:normal`,
          ),
          console.log(`Found an issue? https://github.com/mswjs/msw/issues`),
          console.log(`Worker script URL:`, t.scriptURL),
          console.log(`Worker scope:`, n.scope),
          e && console.log(`Client ID: %s (%s)`, e.id, e.frameType),
          console.groupEnd());
      }
      #m() {
        console.log(
          `%c${f.formatMessage(`Mocking disabled.`)}`,
          `color:orangered;font-weight:bold;`,
        );
      }
    }),
    (Ar = class extends Ye {
      #e;
      constructor(e) {
        (super({ request: e.request }), (this.#e = e.event));
      }
      passthrough() {
        this.#e.postMessage(`PASSTHROUGH`);
      }
      respondWith(e) {
        e && this.#t(e);
      }
      errorWith(e) {
        if (e instanceof Response) return this.respondWith(e);
        f.warn(
          `Uncaught exception in the request handler for "%s %s". This exception has been gracefully handled as a 500 response, however, it's strongly recommended to resolve this error, as it indicates a mistake in your code. If you wish to mock an error response, please see this guide: https://mswjs.io/docs/http/mocking-responses/error-responses`,
          this.data.request.method,
          this.data.request.url,
        );
        let t =
          e instanceof Error ? e : Error(e?.toString() || `Request failure`);
        this.respondWith(
          ae.json(
            { name: t.name, message: t.message, stack: t.stack },
            { status: 500, statusText: `Request Handler Error` },
          ),
        );
      }
      async #t(e) {
        let t,
          n,
          r = Mt(e);
        (rn()
          ? ((t = e.body), (n = e.body == null ? void 0 : [e.body]))
          : (t = e.body == null ? null : await e.clone().arrayBuffer()),
          this.#e.postMessage(`MOCK_RESPONSE`, { ...r, body: t }, n));
      }
    }),
    (jr = async (e) => {
      try {
        return {
          error: null,
          data: await e().catch((e) => {
            throw e;
          }),
        };
      } catch (e) {
        return { error: e, data: null };
      }
    }),
    (Mr = [
      `content-encoding`,
      `content-language`,
      `content-location`,
      `content-type`,
      `content-length`,
    ]),
    (Nr = Symbol(`kRedirectCount`)),
    (Pr = class extends TransformStream {
      constructor() {
        (console.warn(
          `[Interceptors]: Brotli decompression of response streams is not supported in the browser`,
        ),
          super({
            transform(e, t) {
              t.enqueue(e);
            },
          }));
      }
    }),
    (Fr = class extends TransformStream {
      constructor(e, ...t) {
        super({}, ...t);
        let n = [super.readable, ...e].reduce((e, t) => e.pipeThrough(t));
        Object.defineProperty(this, "readable", {
          get() {
            return n;
          },
        });
      }
    }),
    (Ir = class e extends nr {
      static {
        this.symbol = Symbol.for(`fetch-interceptor`);
      }
      constructor() {
        super(e.symbol);
      }
      checkEnvironment() {
        return $t(`fetch`);
      }
      async setup() {
        let e = this.logger.extend(`setup`),
          t = globalThis.fetch,
          n = async (e, n) => {
            let r = Xt(),
              i = new gr(
                typeof e == `string` && typeof location < `u` && !on(e)
                  ? new URL(e, location.href)
                  : e,
                n,
              );
            e instanceof Request && cn(i, e);
            let a = new R(),
              o = new Y(i, {
                passthrough: async () => {
                  this.logger.info(
                    `request has not been handled, passthrough...`,
                  );
                  let e = i.clone(),
                    { error: n, data: o } = await jr(() => t(i));
                  if (n) return a.reject(n);
                  if (
                    (this.logger.info(`original fetch performed`, o),
                    this.emitter.listenerCount(`response`) > 0)
                  ) {
                    this.logger.info(`emitting the "response" event...`);
                    let t = X.clone(o);
                    await A(this.emitter, `response`, {
                      response: t,
                      isMockedResponse: !1,
                      request: e,
                      requestId: r,
                    });
                  }
                  a.resolve(o);
                },
                respondWith: async (e) => {
                  if (Sn(e)) {
                    (this.logger.info(`request has errored!`, { response: e }),
                      a.reject(M(e)));
                    return;
                  }
                  this.logger.info(`received mocked response!`, {
                    rawResponse: e,
                  });
                  let t = new X(An(e) || e.body, {
                    url: i.url,
                    status: e.status,
                    statusText: e.statusText,
                    headers: e.headers,
                  });
                  if (X.isRedirectResponse(t.status)) {
                    if (i.redirect === `error`) {
                      a.reject(M(`unexpected redirect`));
                      return;
                    }
                    if (i.redirect === `follow`) {
                      En(i, t).then(
                        (e) => {
                          a.resolve(e);
                        },
                        (e) => {
                          a.reject(e);
                        },
                      );
                      return;
                    }
                  }
                  (this.emitter.listenerCount(`response`) > 0 &&
                    (this.logger.info(`emitting the "response" event...`),
                    await A(this.emitter, `response`, {
                      response: X.clone(t),
                      isMockedResponse: !0,
                      request: i,
                      requestId: r,
                    })),
                    a.resolve(t));
                },
                errorWith: (e) => {
                  (this.logger.info(`request has been aborted!`, { reason: e }),
                    a.reject(e));
                },
              });
            return (
              this.logger.info(`[%s] %s`, i.method, i.url),
              this.logger.info(`awaiting for the mocked response...`),
              this.logger.info(
                `emitting the "request" event for %s listener(s)...`,
                this.emitter.listenerCount(`request`),
              ),
              await Tn({
                request: i,
                requestId: r,
                emitter: this.emitter,
                controller: o,
              }),
              a
            );
          };
        (e.info(`patching global fetch...`),
          this.subscriptions.push(ir.applyPatch(globalThis, `fetch`, () => n)),
          e.info(`global fetch patched!`, globalThis.fetch.name));
      }
    }),
    (Lr = class {
      constructor(e, t) {
        ((this.NONE = 0),
          (this.CAPTURING_PHASE = 1),
          (this.AT_TARGET = 2),
          (this.BUBBLING_PHASE = 3),
          (this.type = ``),
          (this.srcElement = null),
          (this.currentTarget = null),
          (this.eventPhase = 0),
          (this.isTrusted = !0),
          (this.composed = !1),
          (this.cancelable = !0),
          (this.defaultPrevented = !1),
          (this.bubbles = !0),
          (this.lengthComputable = !0),
          (this.loaded = 0),
          (this.total = 0),
          (this.cancelBubble = !1),
          (this.returnValue = !0),
          (this.type = e),
          (this.target = t?.target || null),
          (this.currentTarget = t?.currentTarget || null),
          (this.timeStamp = Date.now()));
      }
      composedPath() {
        return [];
      }
      initEvent(e, t, n) {
        ((this.type = e), (this.bubbles = !!t), (this.cancelable = !!n));
      }
      preventDefault() {
        this.defaultPrevented = !0;
      }
      stopPropagation() {}
      stopImmediatePropagation() {}
    }),
    (Rr = class extends Lr {
      constructor(e, t) {
        (super(e),
          (this.lengthComputable = t?.lengthComputable || !1),
          (this.composed = t?.composed || !1),
          (this.loaded = t?.loaded || 0),
          (this.total = t?.total || 0));
      }
    }),
    (zr = typeof ProgressEvent < `u`),
    ($ = Symbol(`kIsRequestHandled`)),
    (Br = It()),
    (Vr = Symbol(`kFetchRequest`)),
    (Hr = class {
      constructor(e, t) {
        ((this.initialRequest = e),
          (this.logger = t),
          (this.method = `GET`),
          (this.url = null),
          (this[$] = !1),
          (this.events = new Map()),
          (this.uploadEvents = new Map()),
          (this.requestId = Xt()),
          (this.requestHeaders = new Headers()),
          (this.responseBuffer = new Uint8Array()),
          (this.request = Pn(e, {
            setProperty: ([e, t], n) => {
              switch (e) {
                case `ontimeout`: {
                  let r = e.slice(2);
                  return (this.request.addEventListener(r, t), n());
                }
                default:
                  return n();
              }
            },
            methodCall: ([e, t], n) => {
              switch (e) {
                case `open`: {
                  let [e, r] = t;
                  return (
                    r === void 0
                      ? ((this.method = `GET`), (this.url = Vn(e)))
                      : ((this.method = e), (this.url = Vn(r))),
                    (this.logger = this.logger.extend(
                      `${this.method} ${this.url.href}`,
                    )),
                    this.logger.info(`open`, this.method, this.url.href),
                    n()
                  );
                }
                case `addEventListener`: {
                  let [e, r] = t;
                  return (
                    this.registerEvent(e, r),
                    this.logger.info(`addEventListener`, e, r),
                    n()
                  );
                }
                case `setRequestHeader`: {
                  let [e, r] = t;
                  return (
                    this.requestHeaders.set(e, r),
                    this.logger.info(`setRequestHeader`, e, r),
                    n()
                  );
                }
                case `send`: {
                  let [e] = t;
                  this.request.addEventListener(`load`, () => {
                    if (this.onResponse !== void 0) {
                      let e = Rn(this.request, this.request.response);
                      this.onResponse.call(this, {
                        response: e,
                        isMockedResponse: this[$],
                        request: i,
                        requestId: this.requestId,
                      });
                    }
                  });
                  let r = typeof e == `string` ? ln(e) : e,
                    i = this.toFetchApiRequest(r);
                  ((this[Vr] = i.clone()),
                    queueMicrotask(() => {
                      (
                        this.onRequest?.call(this, {
                          request: i,
                          requestId: this.requestId,
                        }) || Promise.resolve()
                      ).finally(() => {
                        if (!this[$])
                          return (
                            this.logger.info(
                              `request callback settled but request has not been handled (readystate %d), performing as-is...`,
                              this.request.readyState,
                            ),
                            Br &&
                              this.request.setRequestHeader(tr, this.requestId),
                            n()
                          );
                      });
                    }));
                  break;
                }
                default:
                  return n();
              }
            },
          })),
          N(
            this.request,
            `upload`,
            Pn(this.request.upload, {
              setProperty: ([e, t], n) => {
                switch (e) {
                  case `onloadstart`:
                  case `onprogress`:
                  case `onaboart`:
                  case `onerror`:
                  case `onload`:
                  case `ontimeout`:
                  case `onloadend`: {
                    let n = e.slice(2);
                    this.registerUploadEvent(n, t);
                  }
                }
                return n();
              },
              methodCall: ([e, t], n) => {
                switch (e) {
                  case `addEventListener`: {
                    let [e, r] = t;
                    return (
                      this.registerUploadEvent(e, r),
                      this.logger.info(`upload.addEventListener`, e, r),
                      n()
                    );
                  }
                }
              },
            }),
          ));
      }
      registerEvent(e, t) {
        let n = (this.events.get(e) || []).concat(t);
        (this.events.set(e, n),
          this.logger.info(`registered event "%s"`, e, t));
      }
      registerUploadEvent(e, t) {
        let n = (this.uploadEvents.get(e) || []).concat(t);
        (this.uploadEvents.set(e, n),
          this.logger.info(`registered upload event "%s"`, e, t));
      }
      async respondWith(e) {
        if (((this[$] = !0), this[Vr])) {
          let e = await Bn(this[Vr]);
          (this.trigger(`loadstart`, this.request.upload, {
            loaded: 0,
            total: e,
          }),
            this.trigger(`progress`, this.request.upload, {
              loaded: e,
              total: e,
            }),
            this.trigger(`load`, this.request.upload, { loaded: e, total: e }),
            this.trigger(`loadend`, this.request.upload, {
              loaded: e,
              total: e,
            }));
        }
        (this.logger.info(
          `responding with a mocked response: %d %s`,
          e.status,
          e.statusText,
        ),
          N(this.request, `status`, e.status),
          N(this.request, `statusText`, e.statusText),
          N(this.request, `responseURL`, this.url.href),
          (this.request.getResponseHeader = new Proxy(
            this.request.getResponseHeader,
            {
              apply: (t, n, r) => {
                if (
                  (this.logger.info(`getResponseHeader`, r[0]),
                  this.request.readyState < this.request.HEADERS_RECEIVED)
                )
                  return (
                    this.logger.info(
                      `headers not received yet, returning null`,
                    ),
                    null
                  );
                let i = e.headers.get(r[0]);
                return (
                  this.logger.info(`resolved response header "%s" to`, r[0], i),
                  i
                );
              },
            },
          )),
          (this.request.getAllResponseHeaders = new Proxy(
            this.request.getAllResponseHeaders,
            {
              apply: () => {
                if (
                  (this.logger.info(`getAllResponseHeaders`),
                  this.request.readyState < this.request.HEADERS_RECEIVED)
                )
                  return (
                    this.logger.info(
                      `headers not received yet, returning empty string`,
                    ),
                    ``
                  );
                let t = Array.from(e.headers.entries()).map(
                  ([e, t]) => `${e}: ${t}`,
                ).join(`\r
`);
                return (
                  this.logger.info(`resolved all response headers to`, t), t
                );
              },
            },
          )),
          Object.defineProperties(this.request, {
            response: {
              enumerable: !0,
              configurable: !1,
              get: () => this.response,
            },
            responseText: {
              enumerable: !0,
              configurable: !1,
              get: () => this.responseText,
            },
            responseXML: {
              enumerable: !0,
              configurable: !1,
              get: () => this.responseXML,
            },
          }));
        let t = await Bn(e.clone());
        (this.logger.info(`calculated response body length`, t),
          this.trigger(`loadstart`, this.request, { loaded: 0, total: t }),
          this.setReadyState(this.request.HEADERS_RECEIVED),
          this.setReadyState(this.request.LOADING));
        let n = () => {
          (this.logger.info(`finalizing the mocked response...`),
            this.setReadyState(this.request.DONE),
            this.trigger(`load`, this.request, {
              loaded: this.responseBuffer.byteLength,
              total: t,
            }),
            this.trigger(`loadend`, this.request, {
              loaded: this.responseBuffer.byteLength,
              total: t,
            }));
        };
        if (e.body) {
          this.logger.info(`mocked response has body, streaming...`);
          let r = e.body.getReader(),
            i = async () => {
              let { value: e, done: a } = await r.read();
              if (a) {
                (this.logger.info(`response body stream done!`), n());
                return;
              }
              (e &&
                (this.logger.info(`read response body chunk:`, e),
                (this.responseBuffer = jn(this.responseBuffer, e)),
                this.trigger(`progress`, this.request, {
                  loaded: this.responseBuffer.byteLength,
                  total: t,
                })),
                i());
            };
          i();
        } else n();
      }
      responseBufferToText() {
        return un(this.responseBuffer);
      }
      get response() {
        if (
          (this.logger.info(
            `getResponse (responseType: %s)`,
            this.request.responseType,
          ),
          this.request.readyState !== this.request.DONE)
        )
          return null;
        switch (this.request.responseType) {
          case `json`: {
            let e = Ln(this.responseBufferToText());
            return (this.logger.info(`resolved response JSON`, e), e);
          }
          case `arraybuffer`: {
            let e = dn(this.responseBuffer);
            return (this.logger.info(`resolved response ArrayBuffer`, e), e);
          }
          case `blob`: {
            let e =
                this.request.getResponseHeader(`Content-Type`) || `text/plain`,
              t = new Blob([this.responseBufferToText()], { type: e });
            return (
              this.logger.info(`resolved response Blob (mime type: %s)`, t, e),
              t
            );
          }
          default: {
            let e = this.responseBufferToText();
            return (
              this.logger.info(
                `resolving "%s" response type as text`,
                this.request.responseType,
                e,
              ),
              e
            );
          }
        }
      }
      get responseText() {
        if (
          (P(
            this.request.responseType === `` ||
              this.request.responseType === `text`,
            `InvalidStateError: The object is in invalid state.`,
          ),
          this.request.readyState !== this.request.LOADING &&
            this.request.readyState !== this.request.DONE)
        )
          return ``;
        let e = this.responseBufferToText();
        return (this.logger.info(`getResponseText: "%s"`, e), e);
      }
      get responseXML() {
        if (
          (P(
            this.request.responseType === `` ||
              this.request.responseType === `document`,
            `InvalidStateError: The object is in invalid state.`,
          ),
          this.request.readyState !== this.request.DONE)
        )
          return null;
        let e = this.request.getResponseHeader(`Content-Type`) || ``;
        return typeof DOMParser > `u`
          ? (console.warn(
              `Cannot retrieve XMLHttpRequest response body as XML: DOMParser is not defined. You are likely using an environment that is not browser or does not polyfill browser globals correctly.`,
            ),
            null)
          : In(e)
            ? new DOMParser().parseFromString(this.responseBufferToText(), e)
            : null;
      }
      errorWith(e) {
        ((this[$] = !0),
          this.logger.info(`responding with an error`),
          this.setReadyState(this.request.DONE),
          this.trigger(`error`, this.request),
          this.trigger(`loadend`, this.request));
      }
      setReadyState(e) {
        if (
          (this.logger.info(
            `setReadyState: %d -> %d`,
            this.request.readyState,
            e,
          ),
          this.request.readyState === e)
        ) {
          this.logger.info(`ready state identical, skipping transition...`);
          return;
        }
        (N(this.request, `readyState`, e),
          this.logger.info(`set readyState to: %d`, e),
          e !== this.request.UNSENT &&
            (this.logger.info(`triggering "readystatechange" event...`),
            this.trigger(`readystatechange`, this.request)));
      }
      trigger(e, t, n) {
        let r = t[`on${e}`],
          i = Mn(t, e, n);
        (this.logger.info(`trigger "%s"`, e, n || ``),
          typeof r == `function` &&
            (this.logger.info(`found a direct "%s" callback, calling...`, e),
            r.call(t, i)));
        let a =
          t instanceof XMLHttpRequestUpload ? this.uploadEvents : this.events;
        for (let [n, r] of a)
          n === e &&
            (this.logger.info(
              `found %d listener(s) for "%s" event, calling...`,
              r.length,
              e,
            ),
            r.forEach((e) => e.call(t, i)));
      }
      toFetchApiRequest(e) {
        this.logger.info(`converting request to a Fetch API Request...`);
        let t = e instanceof Document ? e.documentElement.innerText : e,
          n = new gr(this.url.href, {
            method: this.method,
            headers: this.requestHeaders,
            credentials: this.request.withCredentials
              ? `include`
              : `same-origin`,
            body: [`GET`, `HEAD`].includes(this.method.toUpperCase())
              ? null
              : t,
          });
        return (
          N(
            n,
            `headers`,
            Pn(n.headers, {
              methodCall: ([e, t], r) => {
                switch (e) {
                  case `append`:
                  case `set`: {
                    let [e, n] = t;
                    this.request.setRequestHeader(e, n);
                    break;
                  }
                  case `delete`: {
                    let [e] = t;
                    console.warn(
                      `XMLHttpRequest: Cannot remove a "${e}" header from the Fetch API representation of the "${n.method} ${n.url}" request. XMLHttpRequest headers cannot be removed.`,
                    );
                    break;
                  }
                }
                return r();
              },
            }),
          ),
          cn(n, this.request),
          this.logger.info(`converted request to a Fetch API Request!`, n),
          n
        );
      }
    }),
    (Ur = class e extends nr {
      static {
        this.symbol = Symbol.for(`xhr-interceptor`);
      }
      constructor() {
        super(e.symbol);
      }
      checkEnvironment() {
        return $t(`XMLHttpRequest`);
      }
      setup() {
        let e = this.logger.extend(`setup`);
        (e.info(`patching global XMLHttpRequest...`),
          this.subscriptions.push(
            ir.applyPatch(globalThis, `XMLHttpRequest`, () =>
              Hn({ emitter: this.emitter, logger: this.logger }),
            ),
          ),
          e.info(
            `global XMLHttpRequest patched!`,
            globalThis.XMLHttpRequest.name,
          ));
      }
    }),
    (Wr = class extends Et {
      constructor(e) {
        (super({ interceptors: [new Ur(), new Ir()] }), (this.options = e));
      }
      options;
      enable() {
        (super.enable(), this.options.quiet || this.#e());
      }
      disable() {
        (super.disable(), this.options.quiet || this.#t());
      }
      #e() {
        (console.groupCollapsed(
          `%c${f.formatMessage(`Mocking enabled (fallback mode).`)}`,
          `color:orangered;font-weight:bold;`,
        ),
          console.log(
            `%cDocumentation: %chttps://mswjs.io/docs`,
            `font-weight:bold`,
            `font-weight:normal`,
          ),
          console.log(`Found an issue? https://github.com/mswjs/msw/issues`),
          console.groupEnd());
      }
      #t() {
        console.log(
          `%c${f.formatMessage(`Mocking disabled.`)}`,
          `color:orangered;font-weight:bold;`,
        );
      }
    }),
    (Gr = `/riven-frontend/mockServiceWorker.js`));
})();
export { Un as setupWorker };
