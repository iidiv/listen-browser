## browser-listener
这是单页面应用程序监听浏览器历史状态的一个工具, 能够判断出浏览器前进, 刷新, 返回状态, 并能够记住页面离开前的位置信息, 可配合缓存技术用来实现浏览器返回页面定位到上一次离开时的页面位置

### listenHistory
监听函数

### directUrl
替换原生的 `window.location.replace` & `window.location.href`
- `replace` : directUrl(url, true, false)
- `href`	: directUrl(url, false, true)

### hasRegisterListener
是否已经注册过监听事件了, 也就是当前是否开启了监听浏览器路由变化

### setHistory
设置监听事件的动作

### destroy
销毁该功能

### registerHistoryLitener
在监听事件中注册回调, 可以在每次路由变化时执行该回调

### getRouterCache
获取页面中的时时路由栈