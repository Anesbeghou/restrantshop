-- إنشاء الجدول بنظام T-SQL المتوافق مع SQL Server
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'meals')
BEGIN
    CREATE TABLE meals (
        id INT IDENTITY(1,1) PRIMARY KEY, -- البديل الصحيح لـ AUTO_INCREMENT
        name NVARCHAR(255) NOT NULL,       -- NVARCHAR لدعم اللغة العربية بشكل ممتاز
        price DECIMAL(10, 2) NOT NULL,
        created_at DATETIME DEFAULT GETDATE() -- البديل الصحيح للوقت الحالي
    );
END