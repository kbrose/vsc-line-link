import * as vscode from 'vscode';

// get typings for the VSCode Git extension API
import { GitExtension } from './typings/git';

const SSH_REGEX = /git@(?<host>.*):(?<path>.*)\.git/;
const HTTP_REGEX = /http[s]:\/\/(?<host>.*)\/(?<path>.*)\.git/;

export function activate(context: vscode.ExtensionContext) {
    const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports!;
    let disposable1 = vscode.commands.registerCommand('line-link.copyLink', () => { copyLink(gitExtension); });
    context.subscriptions.push(disposable1);
    let disposable2 = vscode.commands.registerCommand('line-link.openLink', () => { openLink(gitExtension); });
    context.subscriptions.push(disposable2);
}

function copyLink(gitExtension: GitExtension) {
    const link = getLink(gitExtension);
    if (link !== undefined) {
        vscode.env.clipboard.writeText(link);
        vscode.window.showInformationMessage(`copied link ${link}`);
    }
}

function openLink(gitExtension: GitExtension) {
    const link = getLink(gitExtension);
    if (link !== undefined) {
        vscode.env.openExternal(vscode.Uri.parse(link));
    }
}

function getLink(gitExtension: GitExtension): string | undefined {
    const repos = gitExtension.getAPI(1).repositories;
    const workspacePath = vscode.window.activeTextEditor?.document?.uri?.fsPath;

    if ((workspacePath === undefined) || (repos.length === 0)) {
        vscode.window.showErrorMessage("Command must be run from a git folder");
        return;
    }

    const repo = repos[0];
    const head = repo.state.HEAD;
    if (head === undefined) {
        vscode.window.showErrorMessage("Unable to find HEAD of git repo, is it in a workable state?");
        return;
    }
    const upstream = head.upstream;
    if (upstream === undefined) {
        vscode.window.showErrorMessage("No upstream found, does this branch exist on the git server?");
        return;
    }

    const relativePath = removePrefix(workspacePath, repo.rootUri.fsPath);
    const selection = vscode.window.activeTextEditor?.selection!;

    var noMatch = true;
    for (let remote of repo.state.remotes) {
        if (remote.name === upstream.remote) {
            if (remote.fetchUrl !== undefined) {
                const link = remoteStringToUrl(remote.fetchUrl!, upstream.name, relativePath, selection.start.line + 1, selection.end.line + 1);
                if (link === undefined) {
                    vscode.window.showErrorMessage(`Problem parsing git remote string ${remote.fetchUrl}`);
                } else {
                    noMatch = false;
                    return link;
                }
            }
        }
    }
    if (noMatch) {
        vscode.window.showInformationMessage(`Can't find git remote with the name ${upstream.remote}`);
    }
}

function removePrefix(str: string, prefix: string): string {
    if (str.startsWith(prefix)) {
        return str.slice(prefix.length);
    }
    // TODO: raise error
    return str;
}

function remoteStringToUrl(
    remoteString: string, branchName: string, relativePath: string, lineNumStart: number, lineNumEnd: number
): string | undefined {
    var groups: { [key: string]: string; } | undefined;
    if (remoteString.startsWith('git@')) {
        groups = SSH_REGEX.exec(remoteString)?.groups;
    } else {
        groups = HTTP_REGEX.exec(remoteString)?.groups;
    }

    if (groups === undefined) {
        return;
    }

    var lineNumString = "";
    if (lineNumStart !== lineNumEnd) {
        lineNumString = `#L${lineNumStart}-L${lineNumEnd}`;
    } else {
        lineNumString = `#L${lineNumStart}`;
    }

    // Works for both github and gitlab.
    return `https://${groups.host}/${groups.path}/blob/${branchName}${relativePath}${lineNumString}`;
}

// This method is called when your extension is deactivated
export function deactivate() { }
