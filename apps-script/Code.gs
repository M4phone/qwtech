// =============================================
// QW TECH - Google Apps Script Web App
// Google Sheets + Google Drive 문의 폼 백엔드
// =============================================

// ⚠️ 아래 두 값을 설정하세요
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';   // 스프레드시트 ID
const FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID';  // 드라이브 폴더 ID

// CORS 허용을 위한 OPTIONS 처리
function doGet(e) {
  return ContentService.createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 파일 첨부가 있을 경우 Drive에 업로드
    let fileLink = '';
    let fileName = '';
    if (data.file && data.file.data) {
      const folder = DriveApp.getFolderById(FOLDER_ID);
      const decoded = Utilities.base64Decode(data.file.data);
      const blob = Utilities.newBlob(decoded, data.file.mimeType, data.file.name);
      const uploadedFile = folder.createFile(blob);

      // 링크가 있는 모든 사용자가 볼 수 있도록 공유 설정
      uploadedFile.setSharing(
        DriveApp.Access.ANYONE_WITH_LINK,
        DriveApp.Permission.VIEW
      );

      fileLink = uploadedFile.getUrl();
      fileName = data.file.name;
    }

    // Google Sheets에 데이터 기록
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getActiveSheet();

    // 헤더가 없으면 첫 행에 추가
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        '제출일시', '이름', '회사명', '이메일', '국가',
        '제품유형', '수량', '요청사항', '첨부파일명', '첨부파일링크'
      ]);
    }

    sheet.appendRow([
      new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      data.name || '',
      data.company || '',
      data.email || '',
      data.country || '',
      data.product || '',
      data.quantity || '',
      data.details || '',
      fileName,
      fileLink
    ]);

    return buildResponse({ success: true, message: 'Inquiry submitted successfully.' });

  } catch (err) {
    console.error(err);
    return buildResponse({ success: false, error: err.toString() });
  }
}

function buildResponse(obj) {
  const output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
