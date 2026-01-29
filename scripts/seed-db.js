const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://dwcmkpdoqcbjlvsohhek.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3Y21rcGRvcWNiamx2c29oaGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzMxMTgsImV4cCI6MjA4NTIwOTExOH0.TG_xpNt2KzLzVmHzt96sWJeplT8IIT4paDaFwgT9OPM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  console.log('データベースに単元データを投入しています...');
  
  try {
    // 既存のプリセット単元を削除
    const { error: deleteError } = await supabase
      .from('units')
      .delete()
      .eq('is_preset', true);
    
    if (deleteError) {
      console.error('削除エラー:', deleteError);
    } else {
      console.log('既存のプリセット単元を削除しました');
    }

    // SQLファイルを読み込む
    const sqlPath = path.join(__dirname, 'seed-units.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('SQLファイルを読み込みました');
    console.log('注意: このスクリプトはSupabase RPC経由では実行できません');
    console.log('Supabaseダッシュボードの SQL Editor で直接実行してください:');
    console.log('https://dwcmkpdoqcbjlvsohhek.supabase.co');
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

seedDatabase();
