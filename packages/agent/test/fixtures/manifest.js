parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"ZNKF":[function(require,module,exports) {
function n(n,t,e,r,i,s,o){try{var c=n[s](o),u=c.value}catch(a){return void e(a)}c.done?t(u):Promise.resolve(u).then(r,i)}function t(t){return function(){var e=this,r=arguments;return new Promise(function(i,s){var o=t.apply(e,r);function c(t){n(o,i,s,c,u,"next",t)}function u(t){n(o,i,s,c,u,"throw",t)}c(void 0)})}}module.exports={description:"tests",steps:[],assertions:[],children:[{description:"test with failing assertion",steps:[{description:"successful step",action:function(){var n=t(regeneratorRuntime.mark(function n(){return regeneratorRuntime.wrap(function(n){for(;;)switch(n.prev=n.next){case 0:case"end":return n.stop()}},n)}));return function(){return n.apply(this,arguments)}}()}],assertions:[{description:"failing assertion",check:function(){throw new Error("boom")}},{description:"successful assertion",check:function(){return!0}}],children:[]}]};
},{}]},{},["ZNKF"], "__bigtestManifest")
//# sourceMappingURL=/manifest.js.map