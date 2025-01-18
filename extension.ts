//import * as fs from 'fs';
//import * as vscode from 'vscode';
//import * as chardet from 'chardet';
// @ts-ignore
const fs = require('fs');
const vscode = require('vscode');
const chardet = require('chardet');

interface TxtFiles {
	txtfolder: string;
	txtfile1: string;
	txtfile2: string;
	txtfile3: string;
}

function activate(context: vscode.ExtensionContext): void {
	// 极端错误处理
	if (EXTREME_ERROR) {
		vscode.window.showErrorMessage('程序遭遇极端错误，请联系开发者，如需重新启动，请禁用并重新启用本插件');
		return;
	}

	// 设置缓存文件
	const txtfolder: string = context.globalStorageUri.fsPath + '/'; // 缓存根目录
	const txtfile1: string = txtfolder + "txtfile1"; // 已读
	const txtfile2: string = txtfolder + "txtfile2"; // 在读
	const txtfile3: string = txtfolder + "txtfile3"; // 未读


	// 保证父目录存在
	fs.access(txtfolder, (err: NodeJS.ErrnoException | null) => {
		if (err) {
			fs.mkdirSync(txtfolder);
		} else {
			let tempstats = fs.statSync(txtfolder);
			if (!tempstats.isDirectory()) {
				fs.unlinkSync(txtfolder);
				fs.mkdirSync(txtfolder);
			}
		}
	});

	function work_init(): void {
		vscode.window.showOpenDialog({
			canSelectFiles: true,
			canSelectMany: false,
			filters: {
				'Text': ['txt', 'in', 'out', 'ans'],
				'Code': ['c', 'cpp', 'py', 'java', 'go', 'cs', 'rs', 'php', 'html', 'css', 'js', 'json', 'xml', 'sh', 'bat', 'lua', 'sql', 'md', 'conf', 'log', 'gitignore', 'gitattributes']
			},
			openLabel: '选择'
		}).then((uri: vscode.Uri[] | undefined) => {
			if (uri && uri[0]) {
				const frmfile: string = uri[0].fsPath;
				fs.access(frmfile, fs.constants.F_OK | fs.constants.W_OK, (err: NodeJS.ErrnoException | null) => {
					if (err) {
						vscode.window.showErrorMessage('文件不存在或不可读！');
						console.error(`${frmfile} ${err.code === 'ENOENT' ? '不存在' : '只可读'}`);
					} else {
						let buffer: Buffer = fs.readFileSync(frmfile);
						
						let encoding: string = chardet.detect(buffer) || 'utf8';
						
						// Check for binary file
						for (let i = 0; i < buffer.length; i++) {
							if (buffer[i] === 0) {
								vscode.window.showErrorMessage('二进制文件不支持！');
								throw new Error('Binary file detected');
							}
						}
						
						let text: string = buffer.toString(encoding as BufferEncoding);
						text = "\n" + text.replaceAll("\r", "\n") + "\n";
						text = text.replace(/\n\n+/g, "\n");
						text = text.substring(1) + "-- END --\n";
						fs.writeFile(txtfile1, "\n", (err) => { });
						fs.writeFile(txtfile2, "", (err) => { });
						fs.writeFile(txtfile3, text, (err) => { });
						
						vscode.window.showInformationMessage('读取执行完毕');
					}
				});
			}
		});
	}

	async function work_next(): Promise<void> {
		let config: ConfigType = ReadConfig();

		let text: string = fs.readFileSync(txtfile3, 'utf8');
		if (text.length === 0) {
			vscode.window.showInformationMessage(`读完了呢。`);
			return;
		}

		let te: number = 0;
		let huan: string = "";
		while (text[te] !== '\n' && te <= config.wordslimit) ++te;

		let tex2: string = text.substring(0, te);

		if (text[te] === '\n') {
			huan = '\n';
			++te;
		}

		let tex3: string = text.substring(te);

		fs.appendFileSync(txtfile1, fs.readFileSync(txtfile2, 'utf8'));
		fs.writeFileSync(txtfile2, tex2 + huan);
		fs.writeFileSync(txtfile3, tex3);

		if (config.editor.document.getText().indexOf(config.sign) === -1) {
			await config.editor.edit(editBuilder => {
				const begin = new vscode.Position(config.editor.selection.active.line, 0);
				editBuilder.insert(begin, config.sign + "\n");
			});
		}

		for (let i = 0; i < config.editor.document.lineCount; ++i) {
			let line: vscode.TextLine = config.editor.document.lineAt(i);
			let c: number = line.text.indexOf(config.sign);
			if (c !== -1) {
				c += config.sign.length;
				await config.editor.edit(editBuilder => {
					let range: vscode.Range = new vscode.Range(i, c, i, line.text.length);
					editBuilder.replace(range, tex2);
				});
				break;
			}
		}
	}

	async function work_last(): Promise<void> {
		let config: ConfigType = ReadConfig();

		let text: string = fs.readFileSync(txtfile1, 'utf8');
		if (text.length === 0) {
			vscode.window.showInformationMessage(`到头了呢。`);
			return;
		}

		let te: number = text.length;
		let t: number = te;

		let huan: string = "";
		if (text[te - 1] === '\n') {
			--te;
			--t;
			huan = '\n';
		}
		while (text[t - 1] !== '\n' && te - t <= config.wordslimit) --t;

		let tex1: string = text.substring(0, t);
		let tex2: string = text.substring(t, te);

		fs.writeFileSync(txtfile3, fs.readFileSync(txtfile2, 'utf8') + fs.readFileSync(txtfile3, 'utf8'));
		fs.writeFileSync(txtfile2, tex2 + huan);
		fs.writeFileSync(txtfile1, tex1);

		if (config.editor.document.getText().indexOf(config.sign) === -1) {
			await config.editor.edit(editBuilder => {
				const begin = new vscode.Position(config.editor.selection.active.line, 0);
				editBuilder.insert(begin, config.sign + "\n");
			});
		}

		for (let i = 0; i < config.editor.document.lineCount; ++i) {
			let line: vscode.TextLine = config.editor.document.lineAt(i);
			let c: number = line.text.indexOf(config.sign);
			if (c !== -1) {
				c += config.sign.length;
				await config.editor.edit(editBuilder => {
					let range: vscode.Range = new vscode.Range(i, c, i, line.text.length);
					editBuilder.replace(range, tex2);
				});
				break;
			}
		}
	}

	function f_init(): void {
		work_init();
	}

	function f_next(): void {
		fs.access(txtfile1, fs.constants.F_OK | fs.constants.W_OK, (err: NodeJS.ErrnoException | null) => {
			if (err) {
				work_init();
			} else {
				work_next();
			}
		});
	}

	function f_last(): void {
		fs.access(txtfile1, fs.constants.F_OK | fs.constants.W_OK, (err: NodeJS.ErrnoException | null) => {
			if (err) {
				work_init();
			} else {
				work_last();
			}
		});
	}

	// 注册命令
	let disposable1: vscode.Disposable = vscode.commands.registerCommand('txt-read-in-code.init', f_init);
	context.subscriptions.push(disposable1);
	let disposable2: vscode.Disposable = vscode.commands.registerCommand('txt-read-in-code.next', f_next);
	context.subscriptions.push(disposable2);
	let disposable3: vscode.Disposable = vscode.commands.registerCommand('txt-read-in-code.last', f_last);
	context.subscriptions.push(disposable3);
}

// 判断是否在编辑器中
function InEditor(): boolean {
	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return false;
	} else {
		return true;
	}
	ThrowError(ERROR_IMPOSSIBLE);
}

// 读取配置文件
type ConfigType = {
	// @ts-ignore
	editor: vscode.TextEditor,
	wordslimit: number,
	lang: string,
	sign: string
};
function ReadConfig(): ConfigType {
	// 读取配置文件
	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}
	//const codefile = vscode.window.activeTextEditor.document.fileName;
	const wordslimit: number = vscode.workspace.getConfiguration().get("txt-read-in-code.WordsLimit");// 每行最大字数
	const lang = editor.document.languageId;// 语言 ID
	const Sign: object = vscode.workspace.getConfiguration().get("txt-read-in-code.Sign");// 标志符

	// 临时代码-TO-BE-MODIFIED
	let sign: string;
	if (true) {// 检查Sign
		if (typeof Sign != "object") {
			ThrowError(ERROR_SIGN_SETTING);
		}
		if (typeof Sign[lang] == "object" && typeof Sign[lang].a == "string") {
			sign = Sign[lang].a;
		}
		else if (typeof Sign["default"] == "object" && typeof Sign["default"].a == "string") {
			sign = Sign["default"].a;
		}
		else {
			ThrowError(ERROR_SIGN_SETTING);
		}
	}

	let config: ConfigType = {
		editor: editor,
		wordslimit: wordslimit,
		lang: lang,
		sign: sign
	}
	if (CheckConfig(config) == false) {
		ThrowError(ERROR_IMPOSSIBLE);
	}
	return config;
}

// 检测配置文件
function CheckConfig(config: ConfigType): boolean {
	// 检查WordsLimit
	if ((config.wordslimit > 0) == false) {
		ThrowError(ERROR_WORDSLIMIT);
		return false;
	}

	return true;

}

// 错误集中处理
type ErrorType = number;
const ERROR_UNKOWN: ErrorType = -1;
const ERROR_SIGN_SETTING: ErrorType = 2;
const ERROR_FILE_NOT_FOUND: ErrorType = 3;
const ERROR_WORDSLIMIT: ErrorType = 4;
const ERROR_IMPOSSIBLE: ErrorType = 114514;
function ThrowError(err: ErrorType): void {
	switch (err) {
		case ERROR_UNKOWN:
			vscode.window.showErrorMessage(`未知错误(ﾟДﾟ*)ﾉ，请联系开发者`);
			ExtremeErrorExitAndDeactive(err);
			break;
		case ERROR_SIGN_SETTING:
			vscode.window.showErrorMessage(`请检查标志符设定╰（‵□′）╯`);
			ErrorExit(err);
			break;
		case ERROR_WORDSLIMIT:
			vscode.window.showErrorMessage(`请检查每行最大字数设定（￣︶￣）↗`);
			ErrorExit(err);
			break;
		case ERROR_IMPOSSIBLE:
			vscode.window.showErrorMessage(`不可能的错误(╯‵□′)╯︵┻━┻，你这代码有问题啊，快去嘲笑开发者。`);
			ExtremeErrorExitAndDeactive(err);
			break;
		default:
			vscode.window.showErrorMessage(`未正确处理的错误😂，请联系开发者。`);
			ExtremeErrorExitAndDeactive(err);
			break;
	}
	ThrowError(ERROR_IMPOSSIBLE);
}

// 因错误强制退出
function ErrorExit(err: ErrorType): never {
	throw new Error(`Error: ${err}`);
}
// 极端错误强制退出并不再被激活
var EXTREME_ERROR: boolean = false;
function ExtremeErrorExitAndDeactive(err: ErrorType): never {
	EXTREME_ERROR = true
	deactivate();
	throw new Error(`Error: ${err}`);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}