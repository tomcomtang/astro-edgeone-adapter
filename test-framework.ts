import { describeFramework } from '@tencent/astro-framework-detect';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件所在目录，然后获取项目根目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = __dirname;

async function testFramework() {
  try {
    console.log('开始检测项目框架...');
    console.log('项目根目录:', projectRoot);
    console.log('---');
    
    const result = await describeFramework(projectRoot);
    
    console.log('检测结果:');
    console.log(JSON.stringify(result, null, 2));
    console.log('---');
    console.log('框架信息:');
    console.log('  框架名称:', result.Framework);
    console.log('  构建命令:', result.BuildCmd);
    console.log('  安装命令:', result.InstallCmd);
    console.log('  输出目录:', result.OutputDir);
    if (result.IconPath) {
      console.log('  图标路径:', result.IconPath);
    }
    if (result.HasEdgeoneIntegration !== undefined) {
      console.log('  是否集成 EdgeOne:', result.HasEdgeoneIntegration);
    }
  } catch (error) {
    console.error('检测失败:', error);
    if (error instanceof Error) {
      console.error('错误信息:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    process.exit(1);
  }
}

testFramework();

