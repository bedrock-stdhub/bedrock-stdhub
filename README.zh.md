# Bedrock StdHub

[English](README.md) | 简体中文

适用于无“魔改” BDS 服务端的插件加载器。

单词 'stdhub' 是 'stdlib' 和 'hub' 的组合。它一方面是加载插件的枢纽 (hub)，另一方面给插件提供了一些所谓的“标准库” (stdlib) 以使插件脱离脚本环境的“沙盒”。

# 使用方法

请参考官方网站的[文档](https://bedrock-stdhub.gdt.pub/zh/user-manual/get-started.html)。

## 调试模式

如果你想要调试你的插件，请在运行时增加一个 `--debug-mode` 的 flag。这样，应用将会监听每个存在于 `plugins` 文件夹里的文件，每当其中任何一个文件发生变化，应用将会把新的插件文件复制到世界文件夹并删除旧的插件文件。不过应用并不会监听新添加的文件，也不会将其复制到世界文件夹。因此如果你需要测试你的新插件，请重启应用。

---

> `bedrock-stdhub` 仍然处于活跃开发阶段。尚未修复的问题见 issues 页面。如果你能提出解决问题的思路，或打开一个 pull request 以解决问题，我们将不胜感激。
