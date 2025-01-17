const vscode = require('vscode');
const fs = require('fs');

function activate(context) {

	// 设置缓存文件
	const txtfolder = context.globalStorageUri.fsPath + '/';// 缓存根目录
	const txtfile1 = txtfolder + "txtfile1";// 已读
	const txtfile2 = txtfolder + "txtfile2";// 在读
	const txtfile3 = txtfolder + "txtfile3";// 未读

	// 保证父目录存在
	fs.access(txtfolder, (err) => {
		if (err)
		{
			fs.mkdirSync(txtfolder);
		}
		else
		{
			var tempstats = fs.statSync(txtfolder);
			if (!(tempstats.isDirectory()))
			{
				fs.unlinkSync(txtfolder);
				fs.mkdirSync(txtfolder);
			}
		}
	})
	
	function work_init() {
		vscode.window.showOpenDialog(
			{
				canSelectFiles: true,
				canSelectMany: false,
				filters:
				{
					'Text': ['txt', 'in', 'out', 'ans'],
					'Code': ['c', 'cpp', 'py', 'java', 'go', 'cs', 'rs', 'php', 'html', 'css', 'js', 'json', 'xml', 'sh', 'bat', 'lua', 'sql', 'md', 'conf', 'log', 'gitignore', 'gitattributes']
				},
				openLabel: '选择'
			}
		).then((uri) => {
			if (uri && uri[0])
			{
				const frmfile = uri[0].fsPath;
				fs.access(frmfile, fs.constants.F_OK | fs.constants.W_OK, (err) => {
					if (err) {
						vscode.window.showErrorMessage('文件不存在或不可读！');
						console.error(
							`${frmfile} ${err.code === 'ENOENT' ? '不存在' : '只可读'}`);
					}
					else
					{
						let text = fs.readFileSync(frmfile, 'utf8');
						text = "\n" + text.replaceAll("\r", "\n") + "\n";
						text = ((((((((((text.replaceAll("\n\n", "\n")).replaceAll("\n\n", "\n")).replaceAll("\n\n", "\n")).replaceAll("\n\n", "\n")).replaceAll("\n\n", "\n")).replaceAll("\n\n", "\n")).replaceAll("\n\n", "\n")).replaceAll("\n\n", "\n")).replaceAll("\n\n", "\n")).replaceAll("\n\n", "\n"));
						text = text.substring(1) + "-- END --\n";
						fs.writeFile(txtfile1, "\n", (err) => {});
						fs.writeFile(txtfile2, "", (err) => {});
						fs.writeFile(txtfile3, text, (err) => {});
						
						vscode.window.showInformationMessage('读取执行完毕');
					}
				});
			}
		});
	}
	
	async function work_next()
	{
		
		// 读取配置文件
		let editor = vscode.window.activeTextEditor;
		if (!editor)
		{
			return;
		}
		//const codefile = vscode.window.activeTextEditor.document.fileName;
		const wordcount = vscode.workspace.getConfiguration().get("txt-read-in-code.WordCount");// 每行最大字数
		const lang = editor.document.languageId;// 语言 ID
		const Sign = vscode.workspace.getConfiguration().get("txt-read-in-code.Sign");// 标志符
		
		// 检查配置文件
		if (typeof Sign != "object")
		{
			ThrowError(ERROR_SIGN_SETTING);
			return;
		}
		
		if (typeof Sign[lang] == "object" && typeof Sign[lang].a == "string")
		{
			var sign = Sign[lang].a;
		}
		else if (typeof Sign["default"] == "object" && typeof Sign["default"].a == "string")
		{
			var sign = Sign["default"].a;
		}
		else
		{
			ThrowError(ERROR_SIGN_SETTING);
			return;
		}
		
		let text=fs.readFileSync(txtfile3, 'utf8');
		//let t = text.indexOf(tgs)
		
		//let tex1 = text.substring(0, t);
		//t = t + tgs.length;
		if (text.length == 0)
		{
			vscode.window.showInformationMessage(`读完了呢。`);
			return;
		}
		//let te = t;
		let te = 0;
		let huan = "";
		while (text[te] != '\n' && te <= wordcount) ++ te;
		
		let tex2 = text.substring(0, te);
		
		if (text[te] == '\n')
		{
			huan = '\n';
			++ te;
		}
		
		let tex3 = text.substring(te);
		
		fs.appendFileSync(txtfile1, fs.readFileSync(txtfile2, 'utf8'));
		fs.writeFileSync(txtfile2, tex2 + huan, (err) => {});
		fs.writeFileSync(txtfile3, tex3, (err) => {});
		
		//let code = fs.readFileSync(codefile, 'utf8');
		
		if (editor.document.getText().indexOf(sign) == -1)
		{
			await editor.edit(editBuilder => {
				const begin = new vscode.Position(editor.selection.active.line, 0);
				editBuilder.insert(begin, sign + "\n");
			});
		}
		
		for (let i = 0; i < editor.document.lineCount; ++ i)
		{
			let line = editor.document.lineAt(i);
			let c = line.text.indexOf(sign);
			if (c != -1)
			{
				c += sign.length;
				await editor.edit(editBuilder => {
					var range = new vscode.Range(i, c, i, line.text.length);
					editBuilder.replace(range, tex2);
				});
				break;
			}
		}
	}
	
	async function work_last()
	{
		let editor = vscode.window.activeTextEditor;
		if (!editor)
		{
			return;
		}
		//const codefile = vscode.window.activeTextEditor.document.fileName;
		const wordcount = vscode.workspace.getConfiguration().get("txt-read-in-code.WordCount");
		const lang = editor.document.languageId;
		const Sign = vscode.workspace.getConfiguration().get("txt-read-in-code.Sign");
		
		if (typeof Sign != "object")
		{
			ThrowError(ERROR_SIGN_SETTING);
			return;
		}
		
		if (typeof Sign[lang] == "object" && typeof Sign[lang].a == "string")
		{
			let sign: string = Sign[lang].a;
		}
		else if (typeof Sign["default"] == "object" && typeof Sign["default"].a == "string")
		{
			var sign = Sign["default"].a;
		}
		else
		{
			ThrowError(ERROR_SIGN_SETTING);
			return;
		}
		
		let text=fs.readFileSync(txtfile1, 'utf8');
		//let t = text.indexOf(tgs)
		
		//let tex1 = text.substring(0, t);
		//t = t + tgs.length;
		if (text.length == 0)
		{
			vscode.window.showInformationMessage(`到头了呢。`);
			return;
		}
		//let te = t;
		
		let te = text.length;
		let t = te;
		
		let huan = "";
		if (text[te - 1] == '\n')
		{
			-- te;
			-- t;
			huan = '\n';
		}
		while (text[t - 1] != '\n' && te - t <= wordcount) -- t;
		
		let tex1 = text.substring(0, t);
		
		let tex2 = text.substring(t, te);
		
		fs.writeFileSync(txtfile3, fs.readFileSync(txtfile2, 'utf8') + fs.readFileSync(txtfile3, 'utf8'), (err) => {});
		fs.writeFileSync(txtfile2, tex2 + huan, (err) => {});
		fs.writeFileSync(txtfile1, tex1, (err) => {});
		
		//let code = fs.readFileSync(codefile, 'utf8');
		
		if (editor.document.getText().indexOf(sign) == -1)
		{
			await editor.edit(editBuilder => {
				const begin = new vscode.Position(editor.selection.active.line, 0);
				editBuilder.insert(begin, sign + "\n");
			});
		}
		
		for (let i = 0; i < editor.document.lineCount; ++ i)
		{
			let line = editor.document.lineAt(i);
			let c = line.text.indexOf(sign);
			if (c != -1)
			{
				c += sign.length;
				await editor.edit(editBuilder => {
					var range = new vscode.Range(i, c, i, line.text.length);
					editBuilder.replace(range, tex2);
				});
				break;
			}
		}
	}
	
	function f_init()
	{
		work_init();
	}
	
	function f_next()
	{
		fs.access(txtfile1, fs.constants.F_OK | fs.constants.W_OK, (err) => {
			if (err)
			{
				work_init();
			}
			else
			{
				work_next();
			}
		});
	}
	
	function f_last()
	{
		fs.access(txtfile1, fs.constants.F_OK | fs.constants.W_OK, (err) => {
			if (err)
			{
				work_init();
			}
			else
			{
				work_last();
			}
		});
	}
	
	// 注册命令
	let disposable1 = vscode.commands.registerCommand('txt-read-in-code.init', f_init);
	context.subscriptions.push(disposable1);
	let disposable2 = vscode.commands.registerCommand('txt-read-in-code.next', f_next);
	context.subscriptions.push(disposable2);
	let disposable3 = vscode.commands.registerCommand('txt-read-in-code.last', f_last);
	context.subscriptions.push(disposable3);
}

// 错误集中处理
const ERROR_SIGN_SETTING = 1;
function ThrowError(err){
	switch (err){
		case ERROR_SIGN_SETTING:
			vscode.window.showErrorMessage(`请检查标志符设定╰（‵□′）╯`);
			break;
		default:
			vscode.window.showErrorMessage(`未正确处理的错误😂，请联系开发者。`);
	}
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}