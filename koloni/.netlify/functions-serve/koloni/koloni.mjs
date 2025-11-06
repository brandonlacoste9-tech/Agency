
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// ../netlify/functions/koloni/koloni.mjs
var koloni_default = (request, context) => {
  try {
    const url = new URL(request.url);
    const subject = url.searchParams.get("name") || "World";
    return new Response(`Hello ${subject}`);
  } catch (error) {
    return new Response(error.toString(), {
      status: 500
    });
  }
};
export {
  koloni_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vbmV0bGlmeS9mdW5jdGlvbnMva29sb25pL2tvbG9uaS5tanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIERvY3Mgb24gcmVxdWVzdCBhbmQgY29udGV4dCBodHRwczovL2RvY3MubmV0bGlmeS5jb20vZnVuY3Rpb25zL2J1aWxkLyNjb2RlLXlvdXItZnVuY3Rpb24tMlxuZXhwb3J0IGRlZmF1bHQgKHJlcXVlc3QsIGNvbnRleHQpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcXVlc3QudXJsKVxuICAgIGNvbnN0IHN1YmplY3QgPSB1cmwuc2VhcmNoUGFyYW1zLmdldCgnbmFtZScpIHx8ICdXb3JsZCdcblxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoYEhlbGxvICR7c3ViamVjdH1gKVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoZXJyb3IudG9TdHJpbmcoKSwge1xuICAgICAgc3RhdHVzOiA1MDAsXG4gICAgfSlcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7OztBQUNBLElBQU8saUJBQVEsQ0FBQyxTQUFTLFlBQVk7QUFDbkMsTUFBSTtBQUNGLFVBQU0sTUFBTSxJQUFJLElBQUksUUFBUSxHQUFHO0FBQy9CLFVBQU0sVUFBVSxJQUFJLGFBQWEsSUFBSSxNQUFNLEtBQUs7QUFFaEQsV0FBTyxJQUFJLFNBQVMsU0FBUyxPQUFPLEVBQUU7QUFBQSxFQUN4QyxTQUFTLE9BQU87QUFDZCxXQUFPLElBQUksU0FBUyxNQUFNLFNBQVMsR0FBRztBQUFBLE1BQ3BDLFFBQVE7QUFBQSxJQUNWLENBQUM7QUFBQSxFQUNIO0FBQ0Y7IiwKICAibmFtZXMiOiBbXQp9Cg==
