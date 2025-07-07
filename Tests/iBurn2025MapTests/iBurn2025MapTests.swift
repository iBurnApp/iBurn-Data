import XCTest
@testable import iBurn2025Map

final class iBurn2025MapTests: XCTestCase {
    
    // MARK: - Basic Resource Existence Tests
    
    func testMapResourcesExist() {
        for resource in iBurn2025Map.MapResource.allCases {
            XCTAssertNotNil(
                resource.url,
                "Map resource \(resource.rawValue) should exist in bundle"
            )
        }
    }
    
    func testMBTilesExists() {
        let mbtilesURL = iBurn2025Map.MapResource.mbtiles.url
        XCTAssertNotNil(mbtilesURL, "MBTiles file should exist")
        
        if let url = mbtilesURL {
            XCTAssertTrue(
                FileManager.default.fileExists(atPath: url.path),
                "MBTiles file should exist at path"
            )
        }
    }
    
    func testStyleFilesExist() {
        let darkStyleURL = iBurn2025Map.MapResource.darkStyle.url
        XCTAssertNotNil(darkStyleURL, "Dark style should exist")
        
        let lightStyleURL = iBurn2025Map.MapResource.lightStyle.url
        XCTAssertNotNil(lightStyleURL, "Light style should exist")
        
        if let darkURL = darkStyleURL {
            XCTAssertTrue(
                FileManager.default.fileExists(atPath: darkURL.path),
                "Dark style file should exist at path"
            )
        }
        
        if let lightURL = lightStyleURL {
            XCTAssertTrue(
                FileManager.default.fileExists(atPath: lightURL.path),
                "Light style file should exist at path"
            )
        }
    }
    
    func testSpriteFilesExist() {
        let spriteJsonURL = iBurn2025Map.MapResource.spriteJson.url
        XCTAssertNotNil(spriteJsonURL, "Sprite JSON should exist")
        
        let sprite2xURL = iBurn2025Map.MapResource.sprite2x.url
        XCTAssertNotNil(sprite2xURL, "Sprite 2x PNG should exist")
        
        if let jsonURL = spriteJsonURL {
            XCTAssertTrue(
                FileManager.default.fileExists(atPath: jsonURL.path),
                "Sprite JSON file should exist at path"
            )
        }
        
        if let pngURL = sprite2xURL {
            XCTAssertTrue(
                FileManager.default.fileExists(atPath: pngURL.path),
                "Sprite 2x PNG file should exist at path"
            )
        }
    }
    
    func testGlyphsDirectoryExists() {
        let glyphsURL = iBurn2025Map.MapResource.glyphsDirectory
        XCTAssertNotNil(glyphsURL, "Glyphs directory should exist")
        
        if let url = glyphsURL {
            var isDirectory: ObjCBool = false
            let exists = FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory)
            XCTAssertTrue(exists, "Glyphs directory should exist at path")
            XCTAssertTrue(isDirectory.boolValue, "Glyphs should be a directory")
        }
    }
    
    func testYearConstant() {
        XCTAssertEqual(iBurn2025Map.year, 2025)
    }
    
    // MARK: - File Content Validation Tests
    
    func testMBTilesFileIntegrity() throws {
        guard let mbtilesURL = iBurn2025Map.MapResource.mbtiles.url else {
            XCTFail("MBTiles URL should not be nil")
            return
        }
        
        let fileData = try Data(contentsOf: mbtilesURL)
        XCTAssertGreaterThan(fileData.count, 1000, "MBTiles file should not be empty")
        
        // Check SQLite magic number (first 16 bytes should be "SQLite format 3\0")
        let sqliteHeader = "SQLite format 3\0".data(using: .utf8)!
        let fileHeader = fileData.prefix(16)
        XCTAssertEqual(
            fileHeader,
            sqliteHeader,
            "MBTiles file should be a valid SQLite database"
        )
    }
    
    func testStyleFilesValidJSON() throws {
        // Test dark style
        guard let darkStyleURL = iBurn2025Map.MapResource.darkStyle.url else {
            XCTFail("Dark style URL should not be nil")
            return
        }
        
        let darkStyleData = try Data(contentsOf: darkStyleURL)
        XCTAssertNoThrow(
            try JSONSerialization.jsonObject(with: darkStyleData, options: []),
            "Dark style should be valid JSON"
        )
        
        // Test light style
        guard let lightStyleURL = iBurn2025Map.MapResource.lightStyle.url else {
            XCTFail("Light style URL should not be nil")
            return
        }
        
        let lightStyleData = try Data(contentsOf: lightStyleURL)
        XCTAssertNoThrow(
            try JSONSerialization.jsonObject(with: lightStyleData, options: []),
            "Light style should be valid JSON"
        )
    }
    
    func testStyleFilesStructure() throws {
        // Test dark style structure
        guard let darkStyleURL = iBurn2025Map.MapResource.darkStyle.url else {
            XCTFail("Dark style URL should not be nil")
            return
        }
        
        let darkStyleData = try Data(contentsOf: darkStyleURL)
        let darkStyleJSON = try JSONSerialization.jsonObject(with: darkStyleData, options: [])
        
        guard let darkStyleDict = darkStyleJSON as? [String: Any] else {
            XCTFail("Dark style should be a JSON dictionary")
            return
        }
        
        XCTAssertNotNil(darkStyleDict["version"], "Style should have version")
        XCTAssertNotNil(darkStyleDict["sources"], "Style should have sources")
        XCTAssertNotNil(darkStyleDict["layers"], "Style should have layers")
        
        // Test light style structure
        guard let lightStyleURL = iBurn2025Map.MapResource.lightStyle.url else {
            XCTFail("Light style URL should not be nil")
            return
        }
        
        let lightStyleData = try Data(contentsOf: lightStyleURL)
        let lightStyleJSON = try JSONSerialization.jsonObject(with: lightStyleData, options: [])
        
        guard let lightStyleDict = lightStyleJSON as? [String: Any] else {
            XCTFail("Light style should be a JSON dictionary")
            return
        }
        
        XCTAssertNotNil(lightStyleDict["version"], "Style should have version")
        XCTAssertNotNil(lightStyleDict["sources"], "Style should have sources")
        XCTAssertNotNil(lightStyleDict["layers"], "Style should have layers")
    }
    
    func testSpriteJsonStructure() throws {
        guard let spriteJsonURL = iBurn2025Map.MapResource.spriteJson.url else {
            XCTFail("Sprite JSON URL should not be nil")
            return
        }
        
        let spriteData = try Data(contentsOf: spriteJsonURL)
        let spriteJSON = try JSONSerialization.jsonObject(with: spriteData, options: [])
        
        guard let spriteDict = spriteJSON as? [String: Any] else {
            XCTFail("Sprite JSON should be a dictionary")
            return
        }
        
        XCTAssertFalse(spriteDict.isEmpty, "Sprite JSON should not be empty")
        
        // Each sprite should have expected structure
        for (key, value) in spriteDict {
            guard let spriteInfo = value as? [String: Any] else {
                XCTFail("Sprite \(key) should have dictionary value")
                continue
            }
            
            XCTAssertNotNil(spriteInfo["x"], "Sprite \(key) should have x coordinate")
            XCTAssertNotNil(spriteInfo["y"], "Sprite \(key) should have y coordinate")
            XCTAssertNotNil(spriteInfo["width"], "Sprite \(key) should have width")
            XCTAssertNotNil(spriteInfo["height"], "Sprite \(key) should have height")
        }
    }
    
    func testSpritePNGFileIntegrity() throws {
        guard let sprite2xURL = iBurn2025Map.MapResource.sprite2x.url else {
            XCTFail("Sprite 2x PNG URL should not be nil")
            return
        }
        
        let pngData = try Data(contentsOf: sprite2xURL)
        XCTAssertGreaterThan(pngData.count, 100, "PNG file should not be empty")
        
        // Check PNG magic number (first 8 bytes: 137 80 78 71 13 10 26 10)
        let pngMagic = Data([137, 80, 78, 71, 13, 10, 26, 10])
        let fileHeader = pngData.prefix(8)
        XCTAssertEqual(
            fileHeader,
            pngMagic,
            "Sprite file should be a valid PNG"
        )
    }
    
    // MARK: - Resource URL Generation Tests
    
    func testResourceURLGeneration() {
        // Test MBTiles URL
        let mbtilesURL = iBurn2025Map.MapResource.mbtiles.url
        XCTAssertNotNil(mbtilesURL)
        XCTAssertTrue(mbtilesURL?.pathExtension == "mbtiles")
        
        // Test style URLs
        let darkStyleURL = iBurn2025Map.MapResource.darkStyle.url
        XCTAssertNotNil(darkStyleURL)
        XCTAssertTrue(darkStyleURL?.pathExtension == "json")
        XCTAssertTrue(darkStyleURL?.path.contains("styles") == true)
        
        let lightStyleURL = iBurn2025Map.MapResource.lightStyle.url
        XCTAssertNotNil(lightStyleURL)
        XCTAssertTrue(lightStyleURL?.pathExtension == "json")
        XCTAssertTrue(lightStyleURL?.path.contains("styles") == true)
        
        // Test sprite URLs
        let spriteJsonURL = iBurn2025Map.MapResource.spriteJson.url
        XCTAssertNotNil(spriteJsonURL)
        XCTAssertTrue(spriteJsonURL?.pathExtension == "json")
        XCTAssertTrue(spriteJsonURL?.path.contains("sprites") == true)
        
        let sprite2xURL = iBurn2025Map.MapResource.sprite2x.url
        XCTAssertNotNil(sprite2xURL)
        XCTAssertTrue(sprite2xURL?.pathExtension == "png")
        XCTAssertTrue(sprite2xURL?.path.contains("sprites") == true)
    }
    
    // MARK: - Directory Structure Tests
    
    func testGlyphsDirectoryStructure() throws {
        guard let glyphsURL = iBurn2025Map.MapResource.glyphsDirectory else {
            XCTFail("Glyphs directory URL should not be nil")
            return
        }
        
        let contents = try FileManager.default.contentsOfDirectory(
            at: glyphsURL,
            includingPropertiesForKeys: [URLResourceKey.isDirectoryKey],
            options: [.skipsHiddenFiles]
        )
        
        XCTAssertFalse(contents.isEmpty, "Glyphs directory should not be empty")
        
        // Should contain font directories
        let fontDirectories = contents.filter { url in
            var isDirectory: ObjCBool = false
            FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory)
            return isDirectory.boolValue
        }
        
        XCTAssertFalse(fontDirectories.isEmpty, "Should have font directories in glyphs")
        
        // Each font directory should contain PBF files
        for fontDir in fontDirectories {
            let pbfFiles = try FileManager.default.contentsOfDirectory(
                at: fontDir,
                includingPropertiesForKeys: nil,
                options: [.skipsHiddenFiles]
            ).filter { $0.pathExtension == "pbf" }
            
            XCTAssertFalse(
                pbfFiles.isEmpty,
                "Font directory \(fontDir.lastPathComponent) should contain PBF files"
            )
        }
    }
    
    // MARK: - File Size Tests
    
    func testResourceFileSizes() throws {
        // MBTiles should be reasonable size
        if let mbtilesURL = iBurn2025Map.MapResource.mbtiles.url {
            let attributes = try FileManager.default.attributesOfItem(atPath: mbtilesURL.path)
            let fileSize = attributes[.size] as? Int64 ?? 0
            XCTAssertGreaterThan(fileSize, 10000, "MBTiles should be at least 10KB")
        }
        
        // Style files should be reasonable size
        if let darkStyleURL = iBurn2025Map.MapResource.darkStyle.url {
            let attributes = try FileManager.default.attributesOfItem(atPath: darkStyleURL.path)
            let fileSize = attributes[.size] as? Int64 ?? 0
            XCTAssertGreaterThan(fileSize, 100, "Dark style should be at least 100 bytes")
        }
        
        if let lightStyleURL = iBurn2025Map.MapResource.lightStyle.url {
            let attributes = try FileManager.default.attributesOfItem(atPath: lightStyleURL.path)
            let fileSize = attributes[.size] as? Int64 ?? 0
            XCTAssertGreaterThan(fileSize, 100, "Light style should be at least 100 bytes")
        }
        
        // Sprite files should be reasonable size
        if let spriteJsonURL = iBurn2025Map.MapResource.spriteJson.url {
            let attributes = try FileManager.default.attributesOfItem(atPath: spriteJsonURL.path)
            let fileSize = attributes[.size] as? Int64 ?? 0
            XCTAssertGreaterThan(fileSize, 50, "Sprite JSON should be at least 50 bytes")
        }
        
        if let sprite2xURL = iBurn2025Map.MapResource.sprite2x.url {
            let attributes = try FileManager.default.attributesOfItem(atPath: sprite2xURL.path)
            let fileSize = attributes[.size] as? Int64 ?? 0
            XCTAssertGreaterThan(fileSize, 1000, "Sprite PNG should be at least 1KB")
        }
    }
    
    // MARK: - Performance Tests
    
    func testResourceAccessPerformance() {
        measure {
            for resource in iBurn2025Map.MapResource.allCases {
                _ = resource.url
            }
        }
    }
    
    func testGlyphsDirectoryPerformance() {
        measure {
            _ = iBurn2025Map.MapResource.glyphsDirectory
        }
    }
}