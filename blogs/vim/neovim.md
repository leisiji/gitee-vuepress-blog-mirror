---
title: neovim 入门
date: 2021-10-28 15:26:24
tags:
 - vim
categories:
 - vim
---

# neovim 入门

neovim 部分特性（部分特性在 0.5 后才有）：

- 使用 lua 作为配置语言，取代了 vimscript
  - 配置换为 lua 后，我的 neovim 载入时间只需要 100ms (i5-8250)
- 使用 treesitter 作为语法高亮，语法高亮更快更好
- 内置 terminal
- floating window
- 内置 language-server-protocol client

neovim 插件合集：[awesome-neovim](https://github.com/rockerBOO/awesome-neovim)

## packer

插件管理 [packer](https://github.com/wbthomason/packer.nvim) 是第一个安装的，安装后可以轻松安装其他插件

```sh
# 安装 packer
git clone --depth 1 https://github.com/wbthomason/packer.nvim\
    ~/.local/share/nvim/site/pack/packer/start/packer.nvim
```

之后添加如下配置，新建 2 个文件：

```lua
-- ~/.config/nvim/lua/init.lua
require('plugins') -- 加载 plugins.lua

-- ~/.config/nvim/lua/plugins.lua
local packer = require('packer')
local use = packer.use
packer.startup(function()
    use {
        'lewis6991/gitsigns.nvim',
        opt = true, event = 'BufRead',
        config = function()
            require('gitsigns').setup {
                signs = {
                    add = {hl = 'GitGutterAdd', text = '+'},
                    change = {hl = 'GitGutterChange', text = '~'},
                    delete = { hl = 'GitGutterDelete', text = '_'},
                    topdelete = { hl = 'GitGutterDelete', text = '‾'},
                    changedelete = { hl = 'GitGutterChange', text = '~' }
                },
                watch_index = { interval = 5000 },
            }
        end
    }
end)
```

添加完后，在 vim 执行命令 `:PackerCompile` 会生成 `~/.config/nvim/plugin/packer_compiled.lua`

## neovim lsp

neovim 0.5 后还引入内置的 language-server-protocol，简称 lsp，使用步骤：

- 安装 [nvim-lspconfig](https://github.com/neovim/nvim-lspconfig) 插件
- 安装语言对应的 language-server

```lua
-- basic config
local on_attach = function(client, _)
    if client.resolved_capabilities.document_highlight then
        -- 高亮当前 Cursor 下的符号
        vim.cmd([[
            augroup lsp_document_highlight
                autocmd! * <buffer>
                au CursorHold <buffer> lua vim.lsp.buf.document_highlight()
                au CursorHold <buffer> lua require('plugins.current_function').update()
                au CursorMoved <buffer> lua vim.lsp.buf.clear_references()
            augroup END
        ]])
    end
end
local cap = vim.lsp.protocol.make_client_capabilities()

-- 使用默认配置 pyright 的简单例子
local default_cfg = { on_attach = on_attach, capabilities = cap }
require('lspconfig').pyright.setup(default_cfg)

-- 配置 clangd 的复杂例子
require('lspconfig').clangd.setup({
  cmd = {
    'clangd', '--background-index', '--clang-tidy',
    '--clang-tidy-checks=performance-*,bugprone-*',
    '--all-scopes-completion', '--completion-style=detailed',
    '--header-insertion=iwyu' 
  },
  on_attach = on_attach, capabilities = cap
})
```

其他 lsp 配置都是类似的配置方式

## 安装 language-server

language-server 由于使用了不同的语言去实现，安装不同的 language-server 较为复杂

如果 root 或有无需 root 的包管理器，可以直接安装 node 和 yarn

node 类 language-server 的准备：将下载的文件解压后并将 bin 目录添加到 PATH 环境变量

- [node](https://npm.taobao.org/mirrors/node/v16.11.1/node-v16.11.1-linux-x64.tar.xz)
- [yarn](https://yarnpkg.com/latest.tar.gz)

node 类的 language-server 通过 `yarn global add xxx` 来安装，注意将 `~/.yarn/bin` 添加到 PATH

- python：[pyright](https://github.com/microsoft/pyright)
- bash：[bash-language-server](https://github.com/bash-lsp/bash-language-server)
- javascript：[tsserver](https://github.com/microsoft/TypeScript)

其他可能需要单独安装：

- c/c++：[clangd](https://github.com/llvm/llvm-project/releases)
- java：[jdtls](https://github.com/eclipse/eclipse.jdt.ls) , [java-language-server](https://github.com/georgewfraser/java-language-server)

jdtls 不支持 Android APP 的 gradle 项目，所以只能使用 java-language-server，但是 aosp 可以使用 jdtls

## java lsp

jdtls 需要在 aosp 根目录下新建 build.gradle：

```groovy
apply plugin: 'java'

sourceSets {
    main {
        java {
            // 根据自身的需求增加 srcDirs
            srcDirs 'frameworks/base/services/core/java'
            srcDirs 'frameworks/base/core/java'
        }
    }
}
```

建议使用 [nvim-jdtls](https://github.com/mfussenegger/nvim-jdtls) 来快速配置好 jdtls

## c/c++ lsp

clangd 需要生成 `compile_commands.json` 才可以构建项目的索引，不同构建工具有不同的生成方法

- cmake：`cmake -DCMAKE_EXPORT_COMPILE_COMMANDS=ON ..`
- 普通 make 项目：[bear](https://github.com/rizsotto/Bear)
- ninja，1.10 以上：`ninja -t compdb > compile_commands.json`

以 kernel 为例：只需要使用 bear 运行 make，`bear -- make -j16`

### aosp c++

aosp 的生成比较复杂，需要分不同 aosp 版本

6.0 以下需要输入一长串命令生成不同子项目的 `compile_commands.json`：

```sh
ONE_SHOT_MAKEFILE=frameworks/av/media/libmedia/Android.mk \
    ~/.local/bin/compiledb make -C /home/workspace2/yexuelin/jmgo_proj/u2_an \
    -f build/core/main.mk all_modules
```

7.0-9.0 的 aosp：[aosp-vscode](https://github.com/amezin/aosp-vscode)，下载仓库的 `generate_compdb.py`

```sh
python generate_compdb.py out/build-${TARGET_PRODUCT}.ninja
```

10.0 后的 aosp：`export SOONG_GEN_COMPDB=1; make nothing` 就会在 out 目录下生成

## neovim lsp 的使用

可以使用 neovim 自带的 lua 函数去查找定义和引用，也可以使用其他插件去查找定义和引用

```vim
" 利用 neovim 自带的函数查找定义
:lua vim.lsp.buf.definition()
" 利用 neovim 自带的函数查找引用
:lua vim.lsp.buf.references()
```

推荐几个比较好用的定义和引用查找插件：

- [goto-preview](https://github.com/rmagatti/goto-preview)
- [lspsaga](https://github.com/tami5/lspsaga.nvim)

其他插件的介绍可以看 awesome-neovim
