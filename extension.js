const vscode = require('vscode');
const fs = require('fs');

function activate(context) {
	/** 缓存根目录 */
	const txtfolder = context.globalStorageUri.fsPath + '\\';
	/** 已读 */
	const txtfile1 = txtfolder + "txtfile1";
	/** 在读 */
	const txtfile2 = txtfolder + "txtfile2";
	/** 未读 */
	const txtfile3 = txtfolder + "txtfile3";
	
	// 保证父目录存在
	!function ()
	{
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
	}()
	
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
	
	function work_next()
	{
		let editor = vscode.window.activeTextEditor;
		if (!editor)
		{
			return;
		}
		//const codefile = vscode.window.activeTextEditor.document.fileName;
		const wordcount = vscode.workspace.getConfiguration().get("txt-read-in-code.WordCount");
		const sign = vscode.workspace.getConfiguration().get("txt-read-in-code.Sign");
		let text=fs.readFileSync(txtfile3, 'utf8');
		//let t = text.indexOf(tgs)
		
		//let tex1 = text.substring(0, t);
		//t = t + tgs.length;
		if (text.length == 0)
		{
			return;
		}
		//let te = t;
		let te = 0;
		let huan = "";
		while (text[te] != '\n' && te <= wordcount) ++ te;
		if (text[te] == '\n') ++ te;
		else huan = '\n';
		
		let tex2 = text.substring(0, te);
		
		let tex3 = text.substring(te);
		
		fs.appendFileSync(txtfile1, fs.readFileSync(txtfile2, 'utf8'));
		fs.writeFileSync(txtfile2, tex2, (err) => {});
		fs.writeFileSync(txtfile3, tex3, (err) => {});
		
		//let code = fs.readFileSync(codefile, 'utf8');
		let code = editor.document.getText();
		let c = code.indexOf(sign);
		if (c == -1)
		{
			editor.edit(editBuilder => {
				const begin = new vscode.Position(0, 0);
				editBuilder.insert(begin, sign + "\n");
			});
			code = sign + "\n" + code;
			c = 0;
		}
		c += sign.length;
		let ce = c;
		while (ce < code.length && code[ce] != '\n') ++ ce;
		if (ce < code.length) ++ ce;
		
		code = code.substring(0, c) + tex2 + huan + code.substring(ce);
		
		//fs.writeFile(codefile, code, (err) => {});
		editor.edit(editBuilder => {
			const begin = new vscode.Position(0, 0);
			const end = new vscode.Position(vscode.window.activeTextEditor.document.lineCount + 1, 0);
			const all = new vscode.Range(begin, end);
			editBuilder.delete(all);
			editBuilder.insert(begin, code);
		});
	}
	
	function work_last()
	{
		let editor = vscode.window.activeTextEditor;
		if (!editor)
		{
			return;
		}
		//const codefile = vscode.window.activeTextEditor.document.fileName;
		const wordcount = vscode.workspace.getConfiguration().get("txt-read-in-code.WordCount");
		const sign = vscode.workspace.getConfiguration().get("txt-read-in-code.Sign");
		let text=fs.readFileSync(txtfile1, 'utf8');
		//let t = text.indexOf(tgs)
		
		//let tex1 = text.substring(0, t);
		//t = t + tgs.length;
		if (text.length == 0)
		{
			return;
		}
		//let te = t;
		
		let te = text.length;
		
		let huan = "";
		if (text[te - 1] == '\n')
			-- te;
		else huan = '\n';
		while (text[te - 1] != '\n' && text.length - te <= wordcount) -- te;
		
		let tex1 = text.substring(0, te);
		
		let tex2 = text.substring(te);
		
		fs.writeFileSync(txtfile3, fs.readFileSync(txtfile2, 'utf8') + fs.readFileSync(txtfile3, 'utf8'), (err) => {});
		fs.writeFileSync(txtfile2, tex2, (err) => {});
		fs.writeFileSync(txtfile1, tex1, (err) => {});
		
		//let code = fs.readFileSync(codefile, 'utf8');
		let code = editor.document.getText();
		let c = code.indexOf(sign);
		if (c == -1)
		{
			code = sign + "\n" + code;
			c = 0;
		}
		c += sign.length;
		let ce = c;
		while (ce < code.length && code[ce] != '\n') ++ ce;
		if (ce < code.length) ++ ce;
		
		code = code.substring(0, c) + tex2 + huan + code.substring(ce);
		
		//fs.writeFile(codefile, code, (err) => {});
		editor.edit(editBuilder => {
			const begin = new vscode.Position(0, 0);
			const end = new vscode.Position(vscode.window.activeTextEditor.document.lineCount + 1, 0);
			const all = new vscode.Range(begin, end);
			editBuilder.delete(all);
			editBuilder.insert(begin, code);
		});
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
	
	let disposable1 = vscode.commands.registerCommand('txt-read-in-code.init', f_init);
	context.subscriptions.push(disposable1);
	
	let disposable2 = vscode.commands.registerCommand('txt-read-in-code.next', f_next);
	context.subscriptions.push(disposable2);
	
	let disposable3 = vscode.commands.registerCommand('txt-read-in-code.last', f_last);
	context.subscriptions.push(disposable3);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
