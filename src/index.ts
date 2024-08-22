import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import parse from 'parse-git-config'
import { consola } from 'consola'

const WORK_DIR = process.cwd()

async function run() {
	try {
		await fs.access(join(WORK_DIR, '.git'))
		const headContent = await fs.readFile(
			join(WORK_DIR, '.git', 'HEAD'),
			'utf8',
		)
		const current = headContent.replace('ref: refs/heads/', '').trim()
		const heads = await fs.readdir(join(WORK_DIR, '.git', 'refs', 'heads'))
		const remotes = await fs.readdir(
			join(WORK_DIR, '.git', 'refs', 'remotes', 'origin'),
		)

		const config = parse.sync({ cwd: WORK_DIR })
		const remoteUrl = config['remote "origin"'].url
		const remoteRepo = remoteUrl
			.split('.git')[0]
			.replace(/^(https?:\/\/)?(github.com\/)?/, '')

		const response = await fetch(
			`https://api.github.com/repos/${remoteRepo}/branches`,
		)

		const remoteBranches = ((await response.json()) as { name: string }[]).map(
			(item) => item.name,
		)

    console.log({ current, heads, remotes, remoteBranches });


		return { current, heads, remotes, remoteBranches }
	} catch (error) {
		consola.error(error)
	}
}

await run()
