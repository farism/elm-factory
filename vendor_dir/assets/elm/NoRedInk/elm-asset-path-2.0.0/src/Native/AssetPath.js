var _user$project$Native_AssetPath = function() {
  if (typeof window === "undefined" ||
      typeof document === "undefined" ||
      typeof document.head === "undefined" ||
      typeof document.head.querySelector === "undefined"
     ) {
    return {
      rootUrl : { ctor : 'Nothing' }
    };
  }

  var rootUrlNode = document.head.querySelector('meta[name="assets-root-url"]');
  var rootUrl =
      (rootUrlNode === null || (typeof rootUrlNode.content !== "string") || rootUrlNode.content.length == 0)
          ? { ctor: 'Nothing' }
          // ensure rootUrl can be simply concatenated with an asbolute path
          : { ctor: 'Just', _0: rootUrlNode.content.replace(/\/$/, '') };

  return {
    rootUrl: rootUrl
  };

}();
