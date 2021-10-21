export function download(filename: string, text: string) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export class FileLoader {
  public static openWithDialog(): Promise<File> {
    return new Promise((resolve, reject) => {
      let input = document.createElement('input');
      input.type = 'file';

      input.onchange = () => {
        if (input.files && input.files[0]) {
          resolve(input.files[0])
        } else {
          reject(-1);
        }
      };

      input.onblur = () => {
        if (!input.files || !input.files[0]) {
          reject(1);
        }
      }
      input.click();
    });
  }

  public static readAsText(file: File): Promise<string>
  {
    return new Promise((resolve,reject) => {
      let reader = new FileReader();
      reader.readAsText(file);
      reader.addEventListener('load',(event) => {
        resolve(reader.result as string);
      });
      reader.addEventListener('error',(event) => {
        reject(reader.error);
      });
    });
  }
}